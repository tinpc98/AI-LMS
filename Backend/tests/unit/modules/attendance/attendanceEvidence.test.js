// Test cho attendanceEvidence.js — TÍNH NĂNG MỚI: điểm danh tự động lớp học trực tuyến
// (đặc tả nghiệp vụ mục 7). Logic thuần, không đụng DB.
import { describe, it, expect } from "vitest";
import {
  computeUnionSeconds,
  computeFirstJoinAt,
  resolveAutoStatus,
  computeAttendanceResult,
} from "#modules/attendance/attendanceEvidence.js";

describe("computeUnionSeconds — hợp nhất khoảng thời gian, không cộng dồn trùng", () => {
  it("1 khoảng đơn giản", () => {
    const sessions = [
      { joinAt: new Date("2026-01-01T10:00:00Z"), leaveAt: new Date("2026-01-01T10:10:00Z") },
    ];
    expect(computeUnionSeconds(sessions)).toBe(600);
  });

  it("2 khoảng KHÔNG chồng lấn (rớt mạng, vào lại) → cộng dồn bình thường", () => {
    const sessions = [
      { joinAt: new Date("2026-01-01T10:00:00Z"), leaveAt: new Date("2026-01-01T10:05:00Z") }, // 300s
      { joinAt: new Date("2026-01-01T10:10:00Z"), leaveAt: new Date("2026-01-01T10:15:00Z") }, // 300s
    ];
    expect(computeUnionSeconds(sessions)).toBe(600);
  });

  it("BUG ĐÃ SỬA — 2 thiết bị cùng lúc (khoảng CHỒNG LẤN) → hợp nhất, KHÔNG cộng dồn thành gấp đôi", () => {
    const sessions = [
      { joinAt: new Date("2026-01-01T10:00:00Z"), leaveAt: new Date("2026-01-01T10:10:00Z") }, // thiết bị 1
      { joinAt: new Date("2026-01-01T10:05:00Z"), leaveAt: new Date("2026-01-01T10:15:00Z") }, // thiết bị 2, chồng 5 phút
    ];
    // Cộng dồn kiểu cũ sẽ ra 1200s (sai) — union đúng phải là 10:00-10:15 = 900s.
    expect(computeUnionSeconds(sessions)).toBe(900);
  });

  it("Khoảng chưa đóng (leaveAt=null, mất kết nối đột ngột) → coi như kết thúc tại `now`", () => {
    const now = new Date("2026-01-01T10:20:00Z");
    const sessions = [{ joinAt: new Date("2026-01-01T10:00:00Z"), leaveAt: null }];
    expect(computeUnionSeconds(sessions, now)).toBe(1200);
  });

  it("Mảng rỗng → 0", () => {
    expect(computeUnionSeconds([])).toBe(0);
  });
});

describe("computeFirstJoinAt", () => {
  it("Nhiều lần join → lấy mốc SỚM NHẤT (không phải lần join gần nhất)", () => {
    const sessions = [
      { joinAt: new Date("2026-01-01T10:05:00Z"), leaveAt: new Date("2026-01-01T10:06:00Z") },
      { joinAt: new Date("2026-01-01T10:00:00Z"), leaveAt: new Date("2026-01-01T10:02:00Z") }, // sớm hơn
    ];
    expect(computeFirstJoinAt(sessions).toISOString()).toBe("2026-01-01T10:00:00.000Z");
  });

  it("Không có session nào → null", () => {
    expect(computeFirstJoinAt([])).toBeNull();
  });
});

describe("resolveAutoStatus — ngưỡng phân loại đặc tả mục 7.1", () => {
  it("ratio >= 70% và delay <= 10 phút → PRESENT", () => {
    expect(resolveAutoStatus(0.7, 600)).toBe("PRESENT");
    expect(resolveAutoStatus(0.9, 0)).toBe("PRESENT");
  });

  it("ratio >= 70% nhưng delay > 10 phút → LATE", () => {
    expect(resolveAutoStatus(0.8, 601)).toBe("LATE");
  });

  it("40% <= ratio < 70% → PARTIAL", () => {
    expect(resolveAutoStatus(0.4, 0)).toBe("PARTIAL");
    expect(resolveAutoStatus(0.69, 0)).toBe("PARTIAL");
  });

  it("ratio < 40% → ABSENT", () => {
    expect(resolveAutoStatus(0.39, 0)).toBe("ABSENT");
    expect(resolveAutoStatus(0, 0)).toBe("ABSENT");
  });
});

describe("computeAttendanceResult — tổng hợp toàn bộ", () => {
  const sessionStart = new Date("2026-01-01T08:00:00Z");
  const sessionEnd = new Date("2026-01-01T09:30:00Z"); // 90 phút = 5400s

  it("Có mặt đủ, vào đúng giờ → PRESENT", () => {
    const evidence = {
      sessions: [
        { joinAt: new Date("2026-01-01T08:02:00Z"), leaveAt: new Date("2026-01-01T09:30:00Z") },
      ],
    };
    const result = computeAttendanceResult(evidence, sessionStart, sessionEnd);
    expect(result.autoStatus).toBe("PRESENT");
    expect(result.firstJoinDelaySeconds).toBe(120);
  });

  it("BUG ĐÃ SỬA — học sinh vào TRƯỚC giờ → delay = 0, không âm", () => {
    const evidence = {
      sessions: [
        { joinAt: new Date("2026-01-01T07:55:00Z"), leaveAt: new Date("2026-01-01T09:30:00Z") },
      ],
    };
    const result = computeAttendanceResult(evidence, sessionStart, sessionEnd);
    expect(result.firstJoinDelaySeconds).toBe(0);
  });

  it("Vào muộn hơn 10 phút nhưng vẫn học đủ 70% → LATE", () => {
    const evidence = {
      sessions: [
        { joinAt: new Date("2026-01-01T08:15:00Z"), leaveAt: new Date("2026-01-01T09:30:00Z") },
      ], // 75 phút / 90 phút = 83%
    };
    const result = computeAttendanceResult(evidence, sessionStart, sessionEnd);
    expect(result.autoStatus).toBe("LATE");
  });

  it("Không có evidence nào (chưa từng vào) → ABSENT, firstJoinDelaySeconds = null", () => {
    const result = computeAttendanceResult({ sessions: [] }, sessionStart, sessionEnd);
    expect(result.autoStatus).toBe("ABSENT");
    expect(result.attendedSeconds).toBe(0);
    expect(result.firstJoinDelaySeconds).toBeNull();
  });

  it("attendedRatio trả về dạng phần trăm (0-100), không phải tỷ lệ 0-1", () => {
    const evidence = {
      sessions: [{ joinAt: sessionStart, leaveAt: sessionEnd }], // full 100%
    };
    const result = computeAttendanceResult(evidence, sessionStart, sessionEnd);
    expect(result.attendedRatio).toBe(100);
  });
});
