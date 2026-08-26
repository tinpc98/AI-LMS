// Test cho assignment.service.js — TÍNH NĂNG MỚI (mục 5): cộng XP khi nộp bài (verified result),
// sourceRef gắn theo assignmentId (không theo attemptId) vì Assignment cho làm lại không giới hạn.
import { describe, it, expect, vi, beforeEach } from "vitest";

const findAttemptById = vi.fn();
const questionFindById = vi.fn();
const assignmentFindById = vi.fn();
const topicFindById = vi.fn();
const awardXpService = vi.fn();
const resolveActiveClassIdForStudent = vi.fn();
const attemptFindOneAndUpdate = vi.fn();
const attemptFindByIdAndUpdate = vi.fn();

vi.mock("#modules/assignment/assignment.repository.js", () => ({
  findAttemptById: (...a) => findAttemptById(...a),
}));
vi.mock("#modules/question/question.model.js", () => ({
  default: { findById: (...a) => questionFindById(...a) },
}));
vi.mock("#modules/topic/topic.model.js", () => ({
  default: { findById: (...a) => topicFindById(...a) },
}));
vi.mock("#modules/assignment/assignment.model.js", () => ({
  default: { findById: (...a) => assignmentFindById(...a) },
}));
vi.mock("#modules/assignment/assignmentAttempt.model.js", () => ({
  default: {
    findOneAndUpdate: (...a) => attemptFindOneAndUpdate(...a),
    findByIdAndUpdate: (...a) => attemptFindByIdAndUpdate(...a),
  },
}));
vi.mock("#modules/badge/xp.service.js", () => ({
  awardXpService: (...a) => awardXpService(...a),
  resolveActiveClassIdForStudent: (...a) => resolveActiveClassIdForStudent(...a),
}));

const { submitAttemptService, gradeEssayService } =
  await import("#modules/assignment/assignment.service.js");

const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });
const withSelect = (result) => ({ select: () => mongooseLean(result) });

const MCQ_Q = {
  _id: "q1",
  type: "MCQ",
  options: [
    { id: "a", isCorrect: true },
    { id: "b", isCorrect: false },
  ],
};

const buildAttempt = (over = {}) => ({
  _id: "attempt-1",
  assignmentId: "assign-1",
  studentId: "student-1",
  status: "IN_PROGRESS",
  expiresAt: new Date(Date.now() + 999999), // Còn nhiều thời gian -> nộp trong hạn.
  performanceProcessedAt: null,
  questions: [
    {
      questionId: "q1",
      points: 10,
      answer: { selectedOptionIds: ["a"] },
      questionSnapshot: { type: "MCQ" },
    },
  ],
  save: vi.fn().mockResolvedValue(true),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  questionFindById.mockResolvedValue(MCQ_Q);
  assignmentFindById.mockReturnValue(withSelect({ topicId: "topic-1" }));
  topicFindById.mockReturnValue(withSelect({ courseId: "course-1" }));
  resolveActiveClassIdForStudent.mockResolvedValue("class-1");
  awardXpService.mockResolvedValue({ _id: "xp-1" });
});

describe("submitAttemptService → _gradeAttempt — cộng XP khi nộp bài", () => {
  it("Nộp đúng hạn, không có câu tự luận → cộng 15 XP nộp bài + 10 XP đúng hạn + 15 XP điểm cao (100%)", async () => {
    findAttemptById.mockResolvedValue(buildAttempt());

    await submitAttemptService("attempt-1", "student-1");

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "student-1",
        classId: "class-1",
        activityType: "Assignment Submitted",
        sourceRef: "assignment:assign-1",
        xpAmount: 15,
      })
    );
    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-ontime:assign-1", xpAmount: 10 })
    );
    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-highscore:assign-1", xpAmount: 15 })
    );
  });

  it("Nộp trễ hạn → KHÔNG cộng 10 XP đúng hạn, vẫn cộng 15 XP nộp bài", async () => {
    findAttemptById.mockResolvedValue(buildAttempt({ expiresAt: new Date(Date.now() - 999999) }));

    await submitAttemptService("attempt-1", "student-1");

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment:assign-1" })
    );
    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-ontime:assign-1" })
    );
  });

  it("Điểm dưới 80% → KHÔNG cộng 15 XP điểm cao", async () => {
    questionFindById.mockResolvedValue({
      _id: "q1",
      type: "MCQ",
      options: [
        { id: "a", isCorrect: false },
        { id: "b", isCorrect: true },
      ],
    });
    findAttemptById.mockResolvedValue(buildAttempt()); // Học sinh chọn "a", đáp án đúng là "b" -> sai, 0%.

    await submitAttemptService("attempt-1", "student-1");

    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-highscore:assign-1" })
    );
  });

  it("Bài có câu tự luận (status=SUBMITTED, chưa có điểm cuối) → CHƯA cộng XP điểm cao ở bước nộp bài", async () => {
    findAttemptById.mockResolvedValue(
      buildAttempt({
        questions: [
          {
            questionId: "q1",
            points: 10,
            answer: { selectedOptionIds: ["a"] },
            questionSnapshot: { type: "MCQ" },
          },
          {
            questionId: "q2",
            points: 10,
            answer: { text: "..." },
            questionSnapshot: { type: "ESSAY" },
          },
        ],
      })
    );

    await submitAttemptService("attempt-1", "student-1");

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment:assign-1" })
    );
    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-highscore:assign-1" })
    );
  });

  it("Không resolve được classId (học sinh không có lớp ACTIVE) → bỏ qua cộng XP, không throw", async () => {
    resolveActiveClassIdForStudent.mockResolvedValue(null);
    findAttemptById.mockResolvedValue(buildAttempt());

    await expect(submitAttemptService("attempt-1", "student-1")).resolves.toBeTruthy();
    expect(awardXpService).not.toHaveBeenCalled();
  });
});

describe("gradeEssayService — cộng XP điểm cao SAU KHI chấm xong hết câu tự luận", () => {
  const makeGradedUpdate = (overrides = {}) => ({
    _id: "attempt-1",
    assignmentId: "assign-1",
    studentId: "student-1",
    status: "GRADED",
    score: 20,
    questions: [
      { questionId: "q1", points: 10, score: 10, isCorrect: true },
      { questionId: "q2", points: 10, score: 10, isCorrect: true },
    ],
    ...overrides,
  });

  it("Vừa chấm xong câu tự luận cuối cùng, tổng điểm >=80% → cộng 15 XP điểm cao", async () => {
    findAttemptById.mockResolvedValue(
      buildAttempt({
        status: "SUBMITTED",
        __v: 0,
        questions: [
          { questionId: "q1", points: 10, score: 10, isCorrect: true },
          {
            questionId: "q2",
            points: 10,
            score: 0,
            isCorrect: null,
            questionSnapshot: { type: "ESSAY" },
          },
        ],
      })
    );
    attemptFindOneAndUpdate.mockResolvedValue(makeGradedUpdate());

    await gradeEssayService("attempt-1", "q2", 10, "Tốt");

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "student-1",
        classId: "class-1",
        activityType: "Assignment Submitted",
        sourceRef: "assignment-highscore:assign-1",
        xpAmount: 15,
      })
    );
  });

  it("Chấm xong nhưng điểm dưới 80% → không cộng XP điểm cao", async () => {
    findAttemptById.mockResolvedValue(
      buildAttempt({
        status: "SUBMITTED",
        __v: 0,
        questions: [
          { questionId: "q1", points: 10, score: 10, isCorrect: true },
          {
            questionId: "q2",
            points: 10,
            score: 0,
            isCorrect: null,
            questionSnapshot: { type: "ESSAY" },
          },
        ],
      })
    );
    attemptFindOneAndUpdate.mockResolvedValue(makeGradedUpdate({ score: 10 }));

    await gradeEssayService("attempt-1", "q2", 0, "Chưa đạt");

    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: "assignment-highscore:assign-1" })
    );
  });
});
