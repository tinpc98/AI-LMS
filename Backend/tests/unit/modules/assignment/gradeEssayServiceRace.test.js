// Test cho assignment.service.js#gradeEssayService — chốt lỗi race condition thật đã tìm và sửa
// trong đợt review toàn dự án: trước đây đọc CẢ document trong 1 transaction, sửa mảng
// questions[] trong bộ nhớ, rồi attempt.save({session}) ghi đè NGUYÊN mảng đó. MongoDB
// transaction chỉ phát hiện write-conflict khi ĐANG chạy, không tự retry — 2 giáo viên chấm gần
// như đồng thời (2 câu essay khác nhau của cùng attempt) sẽ nhận lỗi cứng thay vì điểm được ghi.
// Sửa bằng optimistic lock trên __v (Mongoose version key có sẵn) + $set theo đúng index câu
// hỏi, retry tối đa 5 lần nếu bị chen.
import { describe, it, expect, vi, beforeEach } from "vitest";

const attemptFindById = vi.fn();
const attemptFindOneAndUpdate = vi.fn();
const attemptFindByIdAndUpdate = vi.fn();

vi.mock("#modules/assignment/assignmentAttempt.model.js", () => ({
  default: {
    findById: (...a) => attemptFindById(...a),
    findOneAndUpdate: (...a) => attemptFindOneAndUpdate(...a),
    findByIdAndUpdate: (...a) => attemptFindByIdAndUpdate(...a),
  },
}));
// TÍNH NĂNG MỚI (mục 5): khi status chuyển GRADED với điểm >=80%, gradeEssayService cố cộng XP
// thưởng — Assignment.findById trả null khiến resolveClassIdForAssignment dừng sớm, các test ở
// đây không quan tâm việc cộng XP nên không cần mock sâu hơn (Topic/badge).
vi.mock("#modules/assignment/assignment.model.js", () => ({
  default: { findById: () => ({ select: () => ({ lean: () => Promise.resolve(null) }) }) },
}));
const { gradeEssayService } = await import("#modules/assignment/assignment.service.js");

const ATTEMPT_ID = "attempt-1";

const makeAttempt = (overrides = {}) => ({
  _id: ATTEMPT_ID,
  status: "SUBMITTED",
  performanceProcessedAt: null,
  __v: 0,
  questions: [
    {
      questionId: "q1",
      questionSnapshot: { type: "ESSAY" },
      points: 10,
      score: 0,
      isCorrect: null,
    },
    { questionId: "q2", questionSnapshot: { type: "MCQ" }, points: 5, score: 5, isCorrect: true },
  ],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  attemptFindByIdAndUpdate.mockResolvedValue({});
});

describe("gradeEssayService — atomic + optimistic lock", () => {
  it("Chấm thành công: dùng findOneAndUpdate với __v hiện tại trong filter, KHÔNG dùng attempt.save()", async () => {
    attemptFindById.mockResolvedValue(makeAttempt());
    const updated = { ...makeAttempt(), status: "GRADED", score: 15, __v: 1 };
    attemptFindOneAndUpdate.mockResolvedValue(updated);

    const result = await gradeEssayService(ATTEMPT_ID, "q1", 10, "Tốt");

    expect(attemptFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: ATTEMPT_ID, __v: 0 },
      expect.objectContaining({
        $set: expect.objectContaining({
          "questions.0.score": 10,
          "questions.0.isCorrect": true,
          "questions.0.answer.feedback": "Tốt",
          score: 15,
          status: "GRADED",
        }),
        $inc: { __v: 1 },
      }),
      { new: true }
    );
    expect(result).toBe(updated);
  });

  it("BUG ĐÃ SỬA — 2 giáo viên chấm gần như đồng thời: người ghi sau bị version-mismatch, đọc lại và thử lại thay vì mất điểm người ghi trước", async () => {
    attemptFindById.mockResolvedValue(makeAttempt());
    const updated = { ...makeAttempt(), status: "GRADED", score: 15, __v: 1 };
    attemptFindOneAndUpdate
      .mockResolvedValueOnce(null) // Lần 1: __v đã đổi vì giáo viên khác vừa ghi
      .mockResolvedValueOnce(updated); // Lần 2 (đọc lại rồi thử lại): thành công

    const result = await gradeEssayService(ATTEMPT_ID, "q1", 10, "");

    expect(attemptFindById).toHaveBeenCalledTimes(2);
    expect(attemptFindOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("GRADED");
  });

  it("Xung đột liên tục vượt số lần thử lại → ném lỗi rõ ràng thay vì âm thầm mất điểm", async () => {
    attemptFindById.mockResolvedValue(makeAttempt());
    attemptFindOneAndUpdate.mockResolvedValue(null); // Luôn mismatch

    await expect(gradeEssayService(ATTEMPT_ID, "q1", 10, "")).rejects.toThrow(
      /Có người khác vừa chấm bài này/
    );
  });

  it("Điểm bị chặn trong khoảng [0, points] kể cả khi client gửi số âm/vượt quá", async () => {
    attemptFindById.mockResolvedValue(makeAttempt());
    attemptFindOneAndUpdate.mockResolvedValue({ ...makeAttempt(), status: "GRADED" });

    await gradeEssayService(ATTEMPT_ID, "q1", 999, "");
    expect(attemptFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ "questions.0.score": 10 }), // points=10, bị chặn lại
      }),
      expect.anything()
    );
  });

  it("Attempt đang IN_PROGRESS (chưa nộp) → chặn chấm điểm", async () => {
    attemptFindById.mockResolvedValue(makeAttempt({ status: "IN_PROGRESS" }));
    await expect(gradeEssayService(ATTEMPT_ID, "q1", 10, "")).rejects.toThrow(
      /has not been submitted/
    );
    expect(attemptFindOneAndUpdate).not.toHaveBeenCalled();
  });
});
