// Chốt job tự động nộp bài khi hết giờ (chính sách 1A).
//
// Đây là job có hậu quả nặng nhất hệ thống: nó CHỐT ĐIỂM của học sinh mà không ai bấm nút.
// Sai ở đây nghĩa là nộp sớm bài đang làm, hoặc chấm rỗng bài đã làm xong.
//
// Cập nhật theo job hiện tại (xem examAttemptAutoSubmit.job.js): không còn dùng aggregate +
// $lookup sang collection exams để tính hạn nộp động (startTime + exam.duration) — attempt giờ
// có sẵn field `expiresAt` (canonical), nên chỉ cần find({status, expiresAt:{$lt:cutoff}}).
// gradeSubmission cũng không còn nhận `answers` — nó tự đọc attempt.questions[].answer.
import { describe, it, expect, vi, beforeEach } from "vitest";

const find = vi.fn();
const gradeSubmission = vi.fn();

const mongooseQuery = (result) => ({
  select: () => ({ lean: async () => result }),
});

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: { find: (...a) => find(...a) },
}));
vi.mock("#modules/exam-attempt/examAttempt.service.js", () => ({
  gradeSubmission: (...a) => gradeSubmission(...a),
}));

const { runExamAttemptAutoSubmit, findOverdueAttempts } =
  await import("#jobs/examAttemptAutoSubmit.job.js");

const MOC = new Date("2026-08-01T10:00:00Z");
const GRACE_PERIOD_MS = 2 * 60 * 1000;

beforeEach(() => {
  find.mockReset().mockReturnValue(mongooseQuery([]));
  gradeSubmission.mockReset().mockResolvedValue({});
});

describe("findOverdueAttempts — điều kiện lọc", () => {
  it("chỉ lấy phiên đang IN_PROGRESS", async () => {
    await findOverdueAttempts(MOC);

    expect(find.mock.calls[0][0]).toMatchObject({ status: "IN_PROGRESS" });
  });

  it("CỘNG ÂN HẠN vào hạn nộp trước khi so sánh", async () => {
    // Thiếu ân hạn thì học sinh bấm nộp đúng giây cuối trên mạng chậm sẽ bị job cướp mất bài
    // ngay trước đó. cutoff = now - GRACE_PERIOD_MS, tương đương so sánh expiresAt < now sau khi
    // đã lùi lại đúng khoảng ân hạn.
    await findOverdueAttempts(MOC);

    const filter = find.mock.calls[0][0];
    const expectedCutoff = new Date(MOC.getTime() - GRACE_PERIOD_MS);
    expect(filter.expiresAt.$lt.getTime()).toBe(expectedCutoff.getTime());
  });

  it("mặc định so với thời điểm hiện tại nếu không truyền", async () => {
    const before = Date.now();
    await findOverdueAttempts();
    const after = Date.now();

    const cutoffMs = find.mock.calls[0][0].expiresAt.$lt.getTime();
    expect(cutoffMs).toBeGreaterThanOrEqual(before - GRACE_PERIOD_MS);
    expect(cutoffMs).toBeLessThanOrEqual(after - GRACE_PERIOD_MS);
  });
});

describe("runExamAttemptAutoSubmit", () => {
  it("không có phiên quá hạn thì KHÔNG gọi chấm điểm", async () => {
    await expect(runExamAttemptAutoSubmit(MOC)).resolves.toEqual({ submitted: 0, failed: 0 });
    expect(gradeSubmission).not.toHaveBeenCalled();
  });

  it("chấm bài theo ĐÚNG những gì đã lưu lên máy chủ (attempt.questions[].answer, không truyền answers rời)", async () => {
    // Điểm mấu chốt của cả chính sách: job không tự bịa bài làm, gradeSubmission tự đọc bản
    // nháp đã lưu qua PATCH /:id/answers — job chỉ cần truyền đúng attemptId.
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }]));

    await runExamAttemptAutoSubmit(MOC);

    expect(gradeSubmission).toHaveBeenCalledWith("a1");
  });

  it("MỘT phiên hỏng không chặn các phiên còn lại", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }]));
    gradeSubmission.mockImplementation(async (id) => {
      if (id === "a2") throw new Error("lỗi ghi DB");
      return {};
    });

    const kq = await runExamAttemptAutoSubmit(MOC);

    expect(kq).toEqual({ submitted: 2, failed: 1 });
    expect(gradeSubmission).toHaveBeenCalledTimes(3);
  });

  it("đếm đúng số phiên đã nộp", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "a1" }, { _id: "a2" }]));

    await expect(runExamAttemptAutoSubmit(MOC)).resolves.toEqual({ submitted: 2, failed: 0 });
  });
});
