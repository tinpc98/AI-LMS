// Chốt thống kê tình trạng bài thi trên màn hình giáo viên.
//
// Hai con số `late` và `abandoned` là mới (Wave 7+). Trước đó giáo viên chỉ thấy total/graded/
// pending, và `pending` chỉ đếm SUBMITTED — nên bài nộp muộn lẫn bài bị bỏ dở đều vô hình.
import { describe, it, expect } from "vitest";
import { buildAttemptStats } from "#modules/exam-attempt/attemptStats.js";

const bai = (status, isLate = false) => ({ status, isLate });

describe("buildAttemptStats", () => {
  it("đếm đúng từng tình trạng", () => {
    const kq = buildAttemptStats([
      bai("GRADED"),
      bai("GRADED"),
      bai("SUBMITTED"),
      bai("IN_PROGRESS"),
      bai("PARTIALLY_GRADED", true),
    ]);

    expect(kq).toEqual({ total: 5, graded: 2, pending: 1, late: 1, abandoned: 1 });
  });

  it("BÀI KẸT IN_PROGRESS được đếm riêng, không lẫn vào pending", () => {
    // Đây là lỗ hổng cũ: hàng chờ chấm chỉ lọc SUBMITTED, nên học sinh mất mạng giữa chừng
    // biến mất khỏi mọi màn hình — không ai biết là có người đã vào thi mà không có kết quả.
    const kq = buildAttemptStats([bai("IN_PROGRESS"), bai("IN_PROGRESS"), bai("SUBMITTED")]);

    expect(kq.abandoned).toBe(2);
    expect(kq.pending).toBe(1);
  });

  it("nộp muộn đếm ĐỘC LẬP với trạng thái — bài đã chấm vẫn có thể là bài muộn", () => {
    const kq = buildAttemptStats([
      bai("GRADED", true),
      bai("SUBMITTED", true),
      bai("GRADED", false),
    ]);

    expect(kq.late).toBe(2);
    expect(kq.graded).toBe(2); // không bị trừ đi vì muộn
  });

  it("danh sách rỗng trả về toàn số 0, không lỗi", () => {
    expect(buildAttemptStats([])).toEqual({
      total: 0,
      graded: 0,
      pending: 0,
      late: 0,
      abandoned: 0,
    });
  });

  it("không truyền gì cũng không sập", () => {
    expect(buildAttemptStats().total).toBe(0);
  });

  it("trạng thái lạ chỉ tính vào total", () => {
    const kq = buildAttemptStats([bai("TRANG_THAI_MOI")]);
    expect(kq).toMatchObject({ total: 1, graded: 0, pending: 0, abandoned: 0 });
  });
});
