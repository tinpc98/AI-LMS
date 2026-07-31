// Chốt hành vi của mapper dashboard học sinh.
//
// VÌ SAO ƯU TIÊN FILE NÀY: đây là chỗ tôi đã sửa ở Wave 1.1 (bỏ Math.random khỏi
// urgentPercent và khỏi fallback id) nhưng CHƯA CÓ TEST NÀO bảo vệ. Một thay đổi không
// được test bảo vệ thì lần refactor sau rất dễ bị đảo ngược mà không ai biết.
//
// Mapper cũng là loại file hay bị đổi chỗ khi tái cấu trúc, nên có test ở đây vừa chốt
// hành vi vừa làm lưới cho Wave 5.
import { describe, it, expect } from "vitest";
import {
  mapAssignmentResponse,
  mapExamResponse,
  mapAnnouncementResponse,
  mapAttendanceResponse,
} from "../src/features/learning/mappers/learningDashboard.mapper";

const DAY = 24 * 60 * 60 * 1000;

describe("mapAssignmentResponse", () => {
  it("dữ liệu không phải mảng thì trả mảng rỗng, không ném lỗi", () => {
    expect(mapAssignmentResponse(null as never)).toEqual([]);
    expect(mapAssignmentResponse(undefined as never)).toEqual([]);
    expect(mapAssignmentResponse({} as never)).toEqual([]);
  });

  it("urgentPercent suy từ HẠN NỘP THẬT, không phải số ngẫu nhiên (Wave 1.1)", () => {
    const nearDeadline = new Date(Date.now() + 1 * DAY).toISOString();
    const farDeadline = new Date(Date.now() + 6 * DAY).toISOString();

    const [gap, xa] = mapAssignmentResponse([
      { _id: "a", title: "Gấp", dueDate: nearDeadline },
      { _id: "b", title: "Xa", dueDate: farDeadline },
    ]);

    // Càng sát hạn thì càng khẩn cấp — quan hệ này phải ổn định.
    expect(gap.urgentPercent).toBeGreaterThan(xa.urgentPercent);
  });

  it("cùng dữ liệu vào thì cùng kết quả ra — KHÔNG còn ngẫu nhiên", () => {
    const input = [{ _id: "a", title: "X", dueDate: new Date(Date.now() + 2 * DAY).toISOString() }];
    const lan1 = mapAssignmentResponse(input);
    const lan2 = mapAssignmentResponse(input);
    expect(lan1).toEqual(lan2);
  });

  it("quá hạn mà chưa nộp thì khẩn cấp tối đa và trạng thái LATE", () => {
    const [item] = mapAssignmentResponse([
      { _id: "a", title: "Trễ", dueDate: new Date(Date.now() - 1 * DAY).toISOString() },
    ]);
    expect(item.urgentPercent).toBe(100);
    expect(item.status).toBe("LATE");
  });

  it("đã nộp thì trạng thái SUBMITTED dù quá hạn", () => {
    const [item] = mapAssignmentResponse([
      {
        _id: "a",
        title: "Đã nộp",
        dueDate: new Date(Date.now() - 5 * DAY).toISOString(),
        isSubmitted: true,
      },
    ]);
    expect(item.status).toBe("SUBMITTED");
  });

  it("thiếu id thì fallback theo INDEX, không phải giá trị ngẫu nhiên (Wave 1.1)", () => {
    const items = mapAssignmentResponse([{ title: "A" }, { title: "B" }]);
    expect(items[0].id).toBe("assign-0");
    expect(items[1].id).toBe("assign-1");
    // Key ổn định giữa các lần render là điều kiện để React tái sử dụng component.
    expect(mapAssignmentResponse([{ title: "A" }])[0].id).toBe("assign-0");
  });

  it("lấy tên lớp từ classMap khi dữ liệu thô không kèm tên", () => {
    const [item] = mapAssignmentResponse(
      [{ _id: "a", title: "X", classId: "c1" }],
      new Map([["c1", "Lớp Toán 10"]])
    );
    expect(item.className).toBe("Lớp Toán 10");
  });
});

describe("mapExamResponse / mapAnnouncementResponse", () => {
  it("id fallback dùng index ở cả hai mapper", () => {
    expect(mapExamResponse([{ title: "E" }])[0].id).toBe("exam-0");
    expect(mapAnnouncementResponse([{ title: "N" }])[0].id).toBe("ann-0");
  });

  it("bài thi chưa có điểm thì NOT_STARTED, có điểm thì COMPLETED", () => {
    const [chua, roi] = mapExamResponse([
      { _id: "1", title: "A" },
      { _id: "2", title: "B", score: 8 },
    ]);
    expect(chua.status).toBe("NOT_STARTED");
    expect(chua.score).toBeNull();
    expect(roi.status).toBe("COMPLETED");
    expect(roi.score).toBe(8);
  });
});

describe("mapAttendanceResponse", () => {
  it("đếm đúng theo từng trạng thái", () => {
    const s = mapAttendanceResponse([
      { status: "PRESENT" },
      { status: "PRESENT" },
      { status: "LATE" },
      { status: "ABSENT" },
    ]);
    expect(s.totalSessions).toBe(4);
    expect(s.presentCount).toBe(2);
    expect(s.lateCount).toBe(1);
    expect(s.absentCount).toBe(1);
  });

  it("tỷ lệ không bao giờ vượt 100", () => {
    const s = mapAttendanceResponse(Array.from({ length: 10 }, () => ({ status: "PRESENT" })));
    expect(s.attendanceRate).toBeLessThanOrEqual(100);
  });
});
