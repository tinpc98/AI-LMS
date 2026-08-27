// Test cho examAttempt.service.js#gradeSubmission (dùng chung với submitExamService qua
// _gradeAttempt nội bộ) — chốt lỗi thật đã tìm và sửa trong đợt review toàn dự án: câu hỏi
// TRUE_FALSE dùng CHÍNH XÁC cấu trúc options[].isCorrect như MCQ nhưng trước đây rơi vào nhánh
// "cần chấm tay", trong khi luồng chấm tay (gradeEssay) lại chỉ nhận ESSAY/SHORT_ANSWER — kẹt
// điểm 0 vĩnh viễn, bài thi không bao giờ chuyển từ PARTIALLY_GRADED sang GRADED.
import { describe, it, expect, vi, beforeEach } from "vitest";

const examAttemptFindById = vi.fn();
const questionFind = vi.fn();
const examFindById = vi.fn();
const awardXpService = vi.fn();

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: { findById: (...a) => examAttemptFindById(...a) },
}));
vi.mock("#modules/question/question.model.js", () => ({
  default: { find: (...a) => questionFind(...a) },
}));
vi.mock("#modules/exam/exam.model.js", () => ({
  default: { findById: (...a) => examFindById(...a) },
}));
vi.mock("#modules/classEnrollment", () => ({ ClassEnrollment: {} }));
vi.mock("#modules/performance/performance.service.js", () => ({
  processAttemptPerformanceService: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("#modules/badge/xp.service.js", () => ({ awardXpService: (...a) => awardXpService(...a) }));
const checkAndAwardPerfectScoreBadge = vi.fn();
vi.mock("#modules/badge/badgeAward.service.js", () => ({
  checkAndAwardPerfectScoreBadge: (...a) => checkAndAwardPerfectScoreBadge(...a),
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
  examFindById.mockReturnValue({ select: () => mongooseLean({ classId: "class-1" }) });
  awardXpService.mockResolvedValue({ _id: "xp-1" });
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

describe("TÍNH NĂNG MỚI (mục 5) — cộng 30 XP 'Exam Finished' khi hoàn thành 1 lượt thi", () => {
  it("Hoàn thành attempt (bất kể GRADED hay PARTIALLY_GRADED) → cộng đúng 30 XP, sourceRef theo attemptId", async () => {
    const attempt = buildAttempt({ studentId: "student-1", examId: "exam-1" });
    examAttemptFindById.mockResolvedValue(attempt);

    await gradeSubmission("attempt-1");

    expect(awardXpService).toHaveBeenCalledWith({
      studentId: "student-1",
      classId: "class-1",
      activityType: "Exam Finished",
      sourceRef: "exam-finish:attempt-1",
      xpAmount: 30,
    });
    // TÍNH NĂNG MỚI (mục 4): buildAttempt() trả lời đúng câu duy nhất -> 5/5 điểm = 100%.
    expect(checkAndAwardPerfectScoreBadge).toHaveBeenCalledWith("student-1");
  });

  it("Exam không tìm thấy classId → bỏ qua cộng XP, không throw", async () => {
    examFindById.mockReturnValue({ select: () => mongooseLean(null) });
    const attempt = buildAttempt({ studentId: "student-1", examId: "exam-1" });
    examAttemptFindById.mockResolvedValue(attempt);

    await expect(gradeSubmission("attempt-1")).resolves.toBeTruthy();
    expect(awardXpService).not.toHaveBeenCalled();
  });

  it("Điểm chưa tuyệt đối (trả lời sai) → không kiểm badge Điểm tuyệt đối", async () => {
    const attempt = buildAttempt({
      studentId: "student-1",
      examId: "exam-1",
      questions: [
        {
          questionId: { toString: () => "q-tf" },
          points: 5,
          answer: { selectedOptionIds: ["opt-false"] }, // Sai
        },
      ],
    });
    examAttemptFindById.mockResolvedValue(attempt);

    await gradeSubmission("attempt-1");

    expect(checkAndAwardPerfectScoreBadge).not.toHaveBeenCalled();
  });

  it("Còn câu tự luận chờ chấm (PARTIALLY_GRADED) → chưa kiểm badge Điểm tuyệt đối", async () => {
    questionFind.mockReturnValue(
      mongooseLean([TRUE_FALSE_Q, { _id: "q-essay", type: "ESSAY", options: [] }])
    );
    const attempt = buildAttempt({
      studentId: "student-1",
      examId: "exam-1",
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

    expect(attempt.status).toBe("PARTIALLY_GRADED");
    expect(checkAndAwardPerfectScoreBadge).not.toHaveBeenCalled();
  });
});
