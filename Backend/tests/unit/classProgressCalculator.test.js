// Unit test cho module tính tiến độ THUẦN (Wave 1.1) — không mock Mongoose/DB,
// vì classProgressCalculator.js chỉ nhận/trả plain object.
import { describe, it, expect } from "vitest";
import {
  computeClassProgress,
  buildProgressMap,
} from "../../src/services/classProgressCalculator.js";

describe("computeClassProgress", () => {
  it("trả null khi lớp chưa có bài giảng lẫn bài tập — để UI hiển thị '—' thay vì khẳng định 0%", () => {
    expect(computeClassProgress({ totalLessons: 0, totalAssignments: 0 })).toBeNull();
  });

  it("trả null khi không truyền tham số nào", () => {
    expect(computeClassProgress()).toBeNull();
  });

  it("học sinh chưa bắt đầu học thì ra 0, không phải null", () => {
    const result = computeClassProgress({
      totalLessons: 10,
      lessonProgressSum: 0,
      totalAssignments: 4,
      submittedAssignments: 0,
    });
    expect(result).toBe(0);
  });

  it("hoàn thành toàn bộ bài giảng và bài tập thì ra đúng 100", () => {
    const result = computeClassProgress({
      totalLessons: 10,
      lessonProgressSum: 1000,
      totalAssignments: 4,
      submittedAssignments: 4,
    });
    expect(result).toBe(100);
  });

  it("trộn 50/50 giữa hai thành phần khi lớp có cả bài giảng lẫn bài tập", () => {
    // bài giảng 100%, bài tập 0% -> 50
    expect(
      computeClassProgress({
        totalLessons: 5,
        lessonProgressSum: 500,
        totalAssignments: 2,
        submittedAssignments: 0,
      })
    ).toBe(50);
  });

  it("KHÔNG thổi phồng khi học sinh mới mở 2/10 bài dù đã học xong cả 2", () => {
    // Đây chính là lỗi của analytics.service.js: nó lấy mẫu số là số document progress (2)
    // nên ra 100%. Mẫu số đúng phải là tổng số bài giảng của lớp (10) -> 20%.
    const result = computeClassProgress({ totalLessons: 10, lessonProgressSum: 200 });
    expect(result).toBe(20);
  });

  it("dùng tiến độ granular chứ không nhị phân — bài học dở dang vẫn được tính", () => {
    // 4 bài, mỗi bài mới học 50% -> chưa bài nào 'completed' nhưng tiến độ phải là 50, không phải 0.
    const result = computeClassProgress({ totalLessons: 4, lessonProgressSum: 200 });
    expect(result).toBe(50);
  });

  it("lớp chỉ có bài giảng thì thành phần bài giảng chiếm trọn 100%, không bị kẹt trần 50%", () => {
    const result = computeClassProgress({
      totalLessons: 4,
      lessonProgressSum: 400,
      totalAssignments: 0,
      submittedAssignments: 0,
    });
    expect(result).toBe(100);
  });

  it("lớp chỉ có bài tập thì thành phần bài tập chiếm trọn 100%", () => {
    const result = computeClassProgress({
      totalLessons: 0,
      totalAssignments: 5,
      submittedAssignments: 5,
    });
    expect(result).toBe(100);
  });

  it("chặn trần ở 100 khi dữ liệu progress còn sót lại từ bài giảng đã bị xoá", () => {
    const result = computeClassProgress({ totalLessons: 1, lessonProgressSum: 300 });
    expect(result).toBe(100);
  });

  it("bỏ qua giá trị âm hoặc không phải số thay vì trả về NaN", () => {
    expect(computeClassProgress({ totalLessons: 5, lessonProgressSum: -100 })).toBe(0);
    expect(computeClassProgress({ totalLessons: 5, lessonProgressSum: undefined })).toBe(0);
  });

  it("làm tròn về số nguyên", () => {
    // 1/3 bài giảng hoàn thành -> 33.33% -> 33
    const result = computeClassProgress({ totalLessons: 3, lessonProgressSum: 100 });
    expect(result).toBe(33);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe("buildProgressMap", () => {
  it("trả về map rỗng khi không có lớp nào", () => {
    expect(buildProgressMap([], {})).toEqual(new Map());
  });

  it("gắn đúng tiến độ cho từng lớp theo khoá chuỗi", () => {
    const map = buildProgressMap(["a", "b"], {
      a: { totalLessons: 2, lessonProgressSum: 200 },
      b: { totalLessons: 2, lessonProgressSum: 0 },
    });
    expect(map.get("a")).toBe(100);
    expect(map.get("b")).toBe(0);
  });

  it("lớp không có số liệu trong bảng tổng hợp thì nhận null, không ném lỗi", () => {
    const map = buildProgressMap(["missing"], {});
    expect(map.get("missing")).toBeNull();
  });
});
