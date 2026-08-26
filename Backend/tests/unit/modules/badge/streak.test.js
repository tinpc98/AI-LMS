// Test cho streak.js — TÍNH NĂNG MỚI (mục 4/5): tính streak N ngày liên tục THUẦN.
import { describe, it, expect } from "vitest";
import { toUtcDateKey, hasStreakEndingOn, yesterdayUtc } from "#modules/badge/streak.js";

describe("toUtcDateKey", () => {
  it("Trả về đúng YYYY-MM-DD theo UTC", () => {
    expect(toUtcDateKey(new Date("2026-03-05T23:59:59.000Z"))).toBe("2026-03-05");
  });
});

describe("yesterdayUtc", () => {
  it("Trả về đúng ngày hôm trước", () => {
    const now = new Date("2026-03-05T10:00:00.000Z");
    expect(toUtcDateKey(yesterdayUtc(now))).toBe("2026-03-04");
  });

  it("Qua đầu tháng vẫn đúng", () => {
    const now = new Date("2026-03-01T10:00:00.000Z");
    expect(toUtcDateKey(yesterdayUtc(now))).toBe("2026-02-28");
  });
});

describe("hasStreakEndingOn — đủ N ngày hoạt động liên tục", () => {
  const buildDateKeySet = (keys) => new Set(keys);

  it("Đủ 7 ngày liên tục kết thúc đúng endDate → true", () => {
    const endDate = new Date("2026-03-07T00:00:00.000Z");
    const keys = buildDateKeySet([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
    expect(hasStreakEndingOn(keys, endDate, 7)).toBe(true);
  });

  it("Thiếu 1 ngày ở giữa chuỗi → false", () => {
    const endDate = new Date("2026-03-07T00:00:00.000Z");
    const keys = buildDateKeySet([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      // Thiếu 03-04
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
    expect(hasStreakEndingOn(keys, endDate, 7)).toBe(false);
  });

  it("Chỉ có 6/7 ngày (thiếu ngày đầu chuỗi) → false", () => {
    const endDate = new Date("2026-03-07T00:00:00.000Z");
    const keys = buildDateKeySet([
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
    ]);
    expect(hasStreakEndingOn(keys, endDate, 7)).toBe(false);
  });

  it("Có nhiều hơn 7 ngày liên tục (streak dài hơn) → vẫn true cho cửa sổ 7 ngày gần nhất", () => {
    const endDate = new Date("2026-03-10T00:00:00.000Z");
    const keys = buildDateKeySet([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
      "2026-03-05",
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
    expect(hasStreakEndingOn(keys, endDate, 7)).toBe(true);
  });

  it("Qua ranh giới tháng vẫn tính đúng", () => {
    const endDate = new Date("2026-03-03T00:00:00.000Z");
    const keys = buildDateKeySet([
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
    expect(hasStreakEndingOn(keys, endDate, 7)).toBe(true);
  });

  it("Set rỗng → false", () => {
    expect(hasStreakEndingOn(new Set(), new Date("2026-03-07T00:00:00.000Z"), 7)).toBe(false);
  });
});
