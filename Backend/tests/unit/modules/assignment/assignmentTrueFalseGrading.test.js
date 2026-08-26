// Test cho assignment.service.js#submitAttemptService — chốt lỗi thật đã tìm và sửa trong đợt
// review toàn dự án: câu hỏi TRUE_FALSE trước đây rơi vào nhánh "cần chấm tay" cùng
// ESSAY/SHORT_ANSWER, nhưng hasManual chỉ đếm ESSAY/SHORT_ANSWER — bài chỉ có MCQ+TRUE_FALSE bị
// đánh dấu GRADED ngay lập tức với điểm TRUE_FALSE SAI VĨNH VIỄN (luôn 0, không đường nào sửa).
import { describe, it, expect, vi, beforeEach } from "vitest";

const findAttemptById = vi.fn();
const questionFindById = vi.fn();

vi.mock("#modules/assignment/assignment.repository.js", () => ({
  findAttemptById: (...a) => findAttemptById(...a),
}));
vi.mock("#modules/question/question.model.js", () => ({
  default: { findById: (...a) => questionFindById(...a) },
}));
vi.mock("#modules/topic/topic.model.js", () => ({ default: {} }));

const { submitAttemptService } = await import("#modules/assignment/assignment.service.js");

const TRUE_FALSE_Q = {
  type: "TRUE_FALSE",
  options: [
    { id: "opt-true", isCorrect: true },
    { id: "opt-false", isCorrect: false },
  ],
};

const buildAttempt = (over = {}) => ({
  studentId: { toString: () => "student-1" },
  status: "IN_PROGRESS",
  questions: [
    {
      questionId: "q-tf",
      points: 5,
      answer: { selectedOptionIds: ["opt-true"] },
      questionSnapshot: { type: "TRUE_FALSE" },
    },
  ],
  save: vi.fn().mockResolvedValue(true),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  questionFindById.mockResolvedValue(TRUE_FALSE_Q);
});

describe("submitAttemptService — BUG ĐÃ SỬA: TRUE_FALSE phải được chấm tự động như MCQ", () => {
  it("Trả lời ĐÚNG → isCorrect=true, ghi điểm, status=GRADED ngay (không cần chấm tay)", async () => {
    const attempt = buildAttempt();
    findAttemptById.mockResolvedValue(attempt);

    await submitAttemptService("attempt-1", "student-1");

    expect(attempt.questions[0].isCorrect).toBe(true);
    expect(attempt.questions[0].score).toBe(5);
    expect(attempt.score).toBe(5);
    expect(attempt.status).toBe("GRADED");
  });

  it("Trả lời SAI → isCorrect=false, điểm 0 (đúng vì sai thật, không phải vì kẹt chưa chấm)", async () => {
    const attempt = buildAttempt({
      questions: [
        {
          questionId: "q-tf",
          points: 5,
          answer: { selectedOptionIds: ["opt-false"] },
          questionSnapshot: { type: "TRUE_FALSE" },
        },
      ],
    });
    findAttemptById.mockResolvedValue(attempt);

    await submitAttemptService("attempt-1", "student-1");

    expect(attempt.questions[0].isCorrect).toBe(false);
    expect(attempt.questions[0].score).toBe(0);
    expect(attempt.status).toBe("GRADED");
  });

  it("Bài có cả TRUE_FALSE (tự động) VÀ ESSAY (chấm tay) → status=SUBMITTED (chờ chấm) chỉ vì ESSAY", async () => {
    questionFindById
      .mockResolvedValueOnce(TRUE_FALSE_Q)
      .mockResolvedValueOnce({ type: "ESSAY", options: [] });
    const attempt = buildAttempt({
      questions: [
        {
          questionId: "q-tf",
          points: 5,
          answer: { selectedOptionIds: ["opt-true"] },
          questionSnapshot: { type: "TRUE_FALSE" },
        },
        {
          questionId: "q-essay",
          points: 5,
          answer: { text: "..." },
          questionSnapshot: { type: "ESSAY" },
        },
      ],
    });
    findAttemptById.mockResolvedValue(attempt);

    await submitAttemptService("attempt-1", "student-1");

    expect(attempt.questions[0].isCorrect).toBe(true); // TRUE_FALSE đã chấm xong
    expect(attempt.questions[1].isCorrect).toBeNull(); // ESSAY vẫn chờ chấm tay
    expect(attempt.status).toBe("SUBMITTED");
  });
});
