import * as assignmentRepo from "./assignment.repository.js";
import Question from "../question/question.model.js";
import Topic from "../topic/topic.model.js";
import mongoose from "mongoose";

// Helper check ownership
const checkTopicTeacherOwnership = async (topicId, userId, role) => {
  if (role === "Admin" || role === "admin" || role === "ADMIN") return true;
  const topic = await Topic.findById(topicId).populate("courseId");
  if (!topic || !topic.courseId) return false;
  return topic.courseId.createdBy.toString() === userId.toString();
};

export const createAssignmentService = async (data, userId) => {
  const assignment = assignmentRepo.createAssignment({ ...data, createdBy: userId });
  await assignment.save();
  return assignment;
};

export const startAttemptService = async (assignmentId, studentId) => {
  const assignment = await assignmentRepo.findAssignmentById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  if (assignment.status !== "PUBLISHED") throw new Error("Assignment is not PUBLISHED");

  // Check existing IN_PROGRESS
  const inProgress = await assignmentRepo.findInProgressAttempt(studentId, assignmentId);
  if (inProgress) throw new Error("You already have an IN_PROGRESS attempt");

  const attemptCount = await assignmentRepo.countAttempts(studentId, assignmentId);

  // Build snapshot
  const attemptQuestions = [];

  // assignment.questions is populated with questionId
  for (const aq of assignment.questions) {
    const q = aq.questionId;
    if (!q) continue;

    const optionsSnapshot =
      q.options?.map((opt) => ({
        id: opt.id,
        content: opt.content,
        order: opt.order,
      })) || [];

    attemptQuestions.push({
      questionId: q._id,
      order: aq.order,
      points: aq.points,
      questionSnapshot: {
        type: q.type,
        content: q.content,
        options: optionsSnapshot,
      },
    });
  }

  const attempt = assignmentRepo.createAttempt({
    assignmentId,
    studentId,
    attemptNumber: attemptCount + 1,
    status: "IN_PROGRESS",
    questions: attemptQuestions,
  });

  await attempt.save();
  return attempt;
};

export const submitAttemptService = async (attemptId, studentId) => {
  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt already submitted");

  let totalScore = 0;

  // Grade
  for (const aq of attempt.questions) {
    const q = await Question.findById(aq.questionId);
    if (!q) continue;

    // BUG ĐÃ SỬA: TRUE_FALSE dùng CHÍNH XÁC cấu trúc options[].isCorrect như MCQ nhưng trước
    // đây rơi vào nhánh else (coi như cần chấm tay) — trong khi gradeEssayService lại CHỈ nhận
    // ESSAY/SHORT_ANSWER, và hasManual bên dưới cũng không tính TRUE_FALSE là "cần chấm tay" —
    // kết quả: bài chỉ có MCQ+TRUE_FALSE bị đánh dấu GRADED ngay lập tức với điểm TRUE_FALSE
    // luôn là 0, SAI VĨNH VIỄN, không có đường nào sửa lại được.
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      const selected = aq.answer?.selectedOptionIds || [];
      const correctOptions = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      // Simple exact match grading for MCQ
      let isCorrect = false;
      if (
        selected.length === correctOptions.length &&
        selected.every((val) => correctOptions.includes(val))
      ) {
        isCorrect = true;
      }

      aq.isCorrect = isCorrect;
      aq.score = isCorrect ? aq.points : 0;
      totalScore += aq.score;
    } else {
      // Manual grading for others
      aq.isCorrect = null;
      aq.score = 0;
    }
  }

  attempt.score = totalScore;
  const hasManual = attempt.questions.some(
    (aq) => aq.questionSnapshot.type === "ESSAY" || aq.questionSnapshot.type === "SHORT_ANSWER"
  );
  attempt.status = hasManual ? "SUBMITTED" : "GRADED";
  attempt.submittedAt = new Date();

  await attempt.save();

  if (attempt.status === "GRADED" && !attempt.performanceProcessedAt) {
    import("../performance/performance.service.js").then(({ processAttemptPerformanceService }) => {
      processAttemptPerformanceService(attempt, "ASSIGNMENT")
        .then(async () => {
          attempt.performanceProcessedAt = new Date();
          await attempt.save();
        })
        .catch((err) => console.error("Performance Process Error:", err));
    });
  }

  return attempt;
};

export const saveAnswerService = async (attemptId, questionId, studentId, answerData) => {
  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
  if (attempt.status !== "IN_PROGRESS")
    throw new Error("Cannot save answers for submitted attempt");

  const aq = attempt.questions.find((q) => q.questionId.toString() === questionId);
  if (!aq) throw new Error("Question not found in attempt");

  aq.answer = answerData;
  await attempt.save();
  return attempt;
};

export const gradeEssayService = async (attemptId, questionId, score, feedback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const attempt = await assignmentRepo.findAttemptById(attemptId, { session });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status === "IN_PROGRESS") throw new Error("Attempt has not been submitted yet");

    const aq = attempt.questions.find((q) => q.questionId.toString() === questionId);
    if (!aq) throw new Error("Question not found in attempt");
    if (aq.questionSnapshot.type !== "ESSAY" && aq.questionSnapshot.type !== "SHORT_ANSWER") {
      throw new Error("Only ESSAY or SHORT_ANSWER can be manually graded");
    }

    // Set the score
    aq.score = Math.min(Math.max(0, score), aq.points); // Bound between 0 and max points
    aq.isCorrect = aq.score > 0;
    if (feedback && !aq.answer) aq.answer = {};
    if (feedback) aq.answer.feedback = feedback;

    // Re-calculate total score
    let totalScore = 0;
    let allGraded = true;
    for (const q of attempt.questions) {
      if (q.score !== undefined && q.score !== null) {
        totalScore += q.score;
      }
      if (q.isCorrect === null) {
        allGraded = false;
      }
    }

    attempt.score = totalScore;

    if (allGraded && attempt.status !== "GRADED") {
      attempt.status = "GRADED";
    }

    await attempt.save({ session });
    await session.commitTransaction();

    // Trigger performance integration AFTER successful commit
    if (attempt.status === "GRADED" && !attempt.performanceProcessedAt) {
      import("../performance/performance.service.js").then(
        ({ processAttemptPerformanceService }) => {
          processAttemptPerformanceService(attempt, "ASSIGNMENT")
            .then(async () => {
              attempt.performanceProcessedAt = new Date();
              await attempt.save(); // Not in transaction
            })
            .catch((err) => console.error("Performance Process Error:", err));
        }
      );
    }

    return attempt;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
