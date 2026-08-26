// Test cho examAttempt.service.js#gradeSubmission (dùng chung với submitExamService qua
// _gradeAttempt nội bộ) — chốt lỗi thật đã tìm và sửa trong đợt review toàn dự án: câu hỏi
// TRUE_FALSE dùng CHÍNH XÁC cấu trúc options[].isCorrect như MCQ nhưng trước đây rơi vào nhánh
// "cần chấm tay", trong khi luồng chấm tay (gradeEssay) lại chỉ nhận ESSAY/SHORT_ANSWER — kẹt
// điểm 0 vĩnh viễn, bài thi không bao giờ chuyển từ PARTIALLY_GRADED sang GRADED.
import { describe, it, expect, vi, beforeEach } from "vitest";

const examAttemptFindById = vi.fn();
const questionFind = vi.fn();

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: { findById: (...a) => examAttemptFindById(...a) },
}));
vi.mock("#modules/question/question.model.js", () => ({
  default: { find: (...a) => questionFind(...a) },
}));
vi.mock("#modules/exam/exam.model.js", () => ({ default: {} }));
vi.mock("#modules/classEnrollment", () => ({ ClassEnrollment: {} }));
vi.mock("#modules/performance/performance.service.js", () => ({
  processAttemptPerformanceService: vi.fn().mockResolvedValue(undefined),
}));

const { gradeSubmission } = await import("#modules/exam-attempt/examAttempt.service.js");

const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });

const TRUE_FALSE_Q = {
  _id: "q-tf",
  type: "TRUE_FALSE",
  options: [
    { id: "opt-true", isCorrect: true },
    { id: "opt-false", isCorrect: false },
  ],
};

const buildAttempt = (over = {}) => ({
  _id: "attempt-1",
  status: "IN_PROGRESS",
  expiresAt: new Date(Date.now() + 999999),
  questions: [
    {
      questionId: { toString: () => "q-tf" },
      points: 5,
      answer: { selectedOptionIds: ["opt-true"] },
    },
  ],
  save: vi.fn().mockResolvedValue(true),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  questionFind.mockReturnValue(mongooseLean([TRUE_FALSE_Q]));
});

describe("gradeSubmission — BUG ĐÃ SỬA: TRUE_FALSE phải được chấm tự động như MCQ", () => {
  it("Trả lời ĐÚNG câu TRUE_FALSE → isCorrect=true, ghi điểm đầy đủ, status=GRADED (không kẹt PARTIALLY_GRADED)", async () => {
    const attempt = buildAttempt();
    examAttemptFindById.mockResolvedValue(attempt);

    await gradeSubmission("attempt-1");

    expect(attempt.questions[0].isCorrect).toBe(true);
    expect(attempt.questions[0].score).toBe(5);
    expect(attempt.score).toBe(5);
    expect(attempt.status).toBe("GRADED");
  });

  it("Trả lời SAI câu TRUE_FALSE → isCorrect=false, điểm 0, VẪN status=GRADED (không phải PARTIALLY_GRADED — đã chấm xong, chỉ là chấm sai)", async () => {
    const attempt = buildAttempt({
      questions: [
        {
          questionId: { toString: () => "q-tf" },
          points: 5,
          answer: { selectedOptionIds: ["opt-false"] },
        },
      ],
    });
    examAttemptFindById.mockResolvedValue(attempt);

    await gradeSubmission("attempt-1");

    expect(attempt.questions[0].isCorrect).toBe(false);
    expect(attempt.questions[0].score).toBe(0);
    expect(attempt.status).toBe("GRADED");
  });

  it("Bài có cả TRUE_FALSE (đã chấm tự động) VÀ ESSAY (cần chấm tay) → status=PARTIALLY_GRADED chỉ vì ESSAY, không phải vì TRUE_FALSE", async () => {
    questionFind.mockReturnValue(
      mongooseLean([TRUE_FALSE_Q, { _id: "q-essay", type: "ESSAY", options: [] }])
    );
    const attempt = buildAttempt({
      questions: [
        {
          questionId: { toString: () => "q-tf" },
          points: 5,
          answer: { selectedOptionIds: ["opt-true"] },
        },
        { questionId: { toString: () => "q-essay" }, points: 5, answer: { text: "..." } },
      ],
    });
    examAttemptFindById.mockResolvedValue(attempt);

    await gradeSubmission("attempt-1");

    expect(attempt.questions[0].isCorrect).toBe(true); // TRUE_FALSE đã chấm xong
    expect(attempt.questions[1].isCorrect).toBeNull(); // ESSAY vẫn chờ chấm tay
    expect(attempt.status).toBe("PARTIALLY_GRADED");
  });
});
