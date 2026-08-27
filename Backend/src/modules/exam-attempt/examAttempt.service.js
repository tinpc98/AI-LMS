import crypto from "crypto";
import Exam from "../exam/exam.model.js";
import ExamAttempt from "./examAttempt.model.js";
import Question from "../question/question.model.js";
import { ClassEnrollment } from "#modules/classEnrollment";
import { compareAnswers } from "./answerScoring.js";
// Import trực tiếp file, không qua #modules/badge — tránh kéo theo learningRanking.service.js
// (cùng nguyên tắc "tránh over-eager barrel export" đã áp dụng ở lesson/attendance).
import { awardXpService } from "../badge/xp.service.js";
import { XP_TABLE } from "../badge/xp.js";
import { checkAndAwardPerfectScoreBadge } from "../badge/badgeAward.service.js";

// Hàm shuffle mảng (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Bulk-fetch Questions và dựng Map { questionId_string -> Question }.
 * Tránh N+1 query.
 */
const buildQuestionMap = async (questionIds) => {
  const validIds = questionIds.filter((id) => id);
  if (validIds.length === 0) return new Map();
  const questions = await Question.find({ _id: { $in: validIds } }).lean();
  return new Map(questions.map((q) => [q._id.toString(), q]));
};

/**
 * Bắt đầu thi: tạo ExamAttempt mới.
 *
 * Security:
 *   1. Exam phải PUBLISHED và trong cửa sổ startAt/endAt.
 *   2. Student phải enrolled vào exam.classId.
 *   3. attemptsAllowed chưa đạt.
 *   4. Không có IN_PROGRESS attempt khác.
 *   5. Unique index chặn race condition tạo duplicate.
 */
export const startExamService = async (examId, studentId) => {
  const exam = await Exam.findById(examId).populate("questions.questionId");
  if (!exam) throw new Error("Exam not found");
  if (exam.status !== "PUBLISHED") throw new Error("Exam is not published");

  const now = new Date();
  if (exam.startAt && now < exam.startAt) {
    const err = new Error("Exam has not started yet");
    err.code = "EXAM_NOT_STARTED";
    err.startAt = exam.startAt;
    throw err;
  }
  if (exam.endAt && now > exam.endAt) throw new Error("Exam has already ended");

  // Kiểm tra enrollment: student phải thuộc classId của exam
  if (exam.classId) {
    const enrollment = await ClassEnrollment.findOne({
      studentId,
      classId: exam.classId,
      status: "ACTIVE",
    });
    if (!enrollment) {
      throw new Error("Bạn không được đăng ký vào lớp học của kỳ thi này");
    }
  }

  // Đếm số lần thi (không tính deleted)
  const attemptCount = await ExamAttempt.countDocuments({
    examId,
    studentId,
    isDeleted: { $ne: true },
  });
  if (attemptCount >= exam.attemptsAllowed) {
    throw new Error("You have reached the maximum number of attempts allowed");
  }

  // Kiểm tra IN_PROGRESS
  const inProgress = await ExamAttempt.findOne({ examId, studentId, status: "IN_PROGRESS" });
  if (inProgress) {
    // Cho phép resume nếu là cùng attempt
    return {
      attemptId: inProgress._id,
      sessionToken: inProgress.sessionToken,
      startedAt: inProgress.startedAt,
      expiresAt: inProgress.expiresAt,
      questions: inProgress.questions,
      isResume: true,
    };
  }

  let attemptQuestions = [];

  for (const eq of exam.questions) {
    const q = eq.questionId;
    if (!q) continue;

    let optionsSnapshot =
      q.options?.map((opt) => ({
        id: opt.id,
        content: opt.content,
        order: opt.order,
      })) || [];

    if (exam.shuffleOptions) {
      optionsSnapshot = shuffleArray(optionsSnapshot);
    }

    attemptQuestions.push({
      questionId: q._id,
      order: eq.order,
      points: eq.points,
      questionSnapshot: {
        type: q.type,
        content: q.content,
        options: optionsSnapshot,
      },
    });
  }

  if (exam.shuffleQuestions) {
    attemptQuestions = shuffleArray(attemptQuestions);
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + exam.duration * 60000);

  let newAttempt;
  try {
    newAttempt = new ExamAttempt({
      examId,
      studentId,
      attemptNumber: attemptCount + 1,
      status: "IN_PROGRESS",
      questions: attemptQuestions,
      startedAt: now,
      expiresAt,
      sessionToken,
    });
    await newAttempt.save();
  } catch (err) {
    if (err.code === 11000) {
      // Unique constraint — race condition
      throw new Error("Bạn đã có phiên làm bài đang tiến hành. Vui lòng tải lại trang.");
    }
    throw err;
  }

  return {
    attemptId: newAttempt._id,
    sessionToken: newAttempt.sessionToken,
    startedAt: newAttempt.startedAt,
    expiresAt: newAttempt.expiresAt,
    questions: newAttempt.questions,
  };
};

export const saveExamAnswerService = async (
  attemptId,
  sessionToken,
  studentId,
  questionId,
  answerData
) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
  if (attempt.sessionToken !== sessionToken) throw new Error("Invalid session token");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt is no longer in progress");

  if (new Date() > attempt.expiresAt) {
    throw new Error("Attempt has expired");
  }

  const aq = attempt.questions.find((q) => q.questionId.toString() === questionId);
  if (!aq) throw new Error("Question not found in attempt");

  aq.answer = answerData;
  await attempt.save();
  return attempt;
};

/**
 * Nộp bài và chấm điểm.
 *
 * MCQ: bulk-fetch Questions → answerScoring.compareAnswers → auto grade
 * Essay: isCorrect = null, score = 0 → PARTIALLY_GRADED
 *
 * Sau khi GRADED: trigger Performance Engine (async, idempotent).
 */
export const submitExamService = async (attemptId, sessionToken, studentId) => {
  // Atomic state transition to prevent concurrent double-submissions
  const attempt = await ExamAttempt.findOneAndUpdate(
    { _id: attemptId, studentId, sessionToken, status: "IN_PROGRESS" },
    { status: "SUBMITTED" },
    { new: true }
  );

  if (!attempt) {
    // Check specific reasons for better error messages
    const checkAttempt = await ExamAttempt.findById(attemptId);
    if (!checkAttempt) throw new Error("Attempt not found");
    if (checkAttempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
    if (checkAttempt.sessionToken !== sessionToken) throw new Error("Invalid session token");
    if (checkAttempt.status !== "IN_PROGRESS") throw new Error("Attempt is no longer in progress");
    throw new Error("Cannot submit attempt due to concurrency error");
  }

  await _gradeAttempt(attempt);
  return attempt;
};

export const isPerfectScore = (attempt) => {
  const maxScore = attempt.questions.reduce((sum, aq) => sum + (aq.points || 0), 0);
  return maxScore > 0 && attempt.score >= maxScore;
};

/**
 * Chấm bài — dùng chung cho submitExamService và gradeSubmission (auto-submit).
 * Bulk-fetch Questions, tránh N+1.
 */
const _gradeAttempt = async (attempt) => {
  const questionIds = attempt.questions.map((aq) => aq.questionId);
  const questionMap = await buildQuestionMap(questionIds);

  let totalScore = 0;
  let hasManual = false;

  for (const aq of attempt.questions) {
    const q = questionMap.get(aq.questionId.toString());
    if (!q) continue;

    const qType = (q.type || "").toUpperCase();
    // BUG ĐÃ SỬA: TRUE_FALSE dùng CHÍNH XÁC cấu trúc options[].isCorrect như MCQ (xem
    // question.model.js) nhưng trước đây rơi vào nhánh else (chấm tay) — trong khi luồng chấm
    // tay (gradeEssay) lại CHỈ nhận ESSAY/SHORT_ANSWER, nên câu TRUE_FALSE không đường nào chấm
    // được, kẹt điểm 0 vĩnh viễn và khiến bài thi không bao giờ chuyển từ PARTIALLY_GRADED
    // sang GRADED.
    if (qType === "MCQ" || qType === "MULTIPLE_CHOICE" || qType === "TRUE_FALSE") {
      const selectedIds = aq.answer?.selectedOptionIds || [];
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      // Dùng answerScoring.js để normalize + compare
      const isCorrect = compareAnswers(correctIds, selectedIds);

      aq.isCorrect = isCorrect;
      aq.score = isCorrect ? aq.points : 0;
      totalScore += aq.score;
    } else {
      // ESSAY / SHORT_ANSWER → manual grade
      aq.isCorrect = null;
      aq.score = 0;
      hasManual = true;
    }
  }

  attempt.score = totalScore;
  attempt.status = hasManual ? "PARTIALLY_GRADED" : "GRADED";
  attempt.submittedAt = new Date();

  if (attempt.submittedAt > attempt.expiresAt) {
    attempt.isLate = true;
    attempt.lateBySeconds = Math.floor(
      (attempt.submittedAt.getTime() - attempt.expiresAt.getTime()) / 1000
    );
  }

  await attempt.save();

  // TÍNH NĂNG MỚI (mục 5): 30 XP cho việc HOÀN THÀNH 1 lượt thi (không phụ thuộc điểm số) —
  // đúng 1 lần/attempt (sourceRef theo attemptId, Exam.attemptsAllowed đã chặn farming bằng
  // cách làm lại vô hạn). Exam đã có classId trực tiếp (khác Assignment/Lesson qua Topic/Course).
  const exam = await Exam.findById(attempt.examId).select("classId").lean();
  if (exam?.classId) {
    await awardXpService({
      studentId: attempt.studentId,
      classId: exam.classId,
      activityType: "Exam Finished",
      sourceRef: `exam-finish:${attempt._id}`,
      xpAmount: XP_TABLE.EXAM_FINISHED,
    });
  }

  // TÍNH NĂNG MỚI (mục 4): "Điểm tuyệt đối" — chỉ kiểm được khi status=GRADED (điểm đã chốt
  // xong hết, không còn câu tự luận chờ chấm tay).
  if (attempt.status === "GRADED" && isPerfectScore(attempt)) {
    await checkAndAwardPerfectScoreBadge(attempt.studentId);
  }

  if (attempt.status === "GRADED" && !attempt.performanceProcessedAt) {
    import("../performance/performance.service.js").then(({ processAttemptPerformanceService }) => {
      processAttemptPerformanceService(attempt, "EXAM")
        .then(async () => {
          await ExamAttempt.findByIdAndUpdate(attempt._id, {
            performanceProcessedAt: new Date(),
          });
        })
        .catch((err) => console.error("Performance Process Error:", err));
    });
  }
};

export const incrementCheatWarningService = async (
  attemptId,
  sessionToken,
  studentId,
  cheatType
) => {
  const attempt = await ExamAttempt.findOneAndUpdate(
    { _id: attemptId, studentId, sessionToken, status: "IN_PROGRESS" },
    {
      $inc: { cheatWarnings: 1 },
      $push: { cheatLogs: { cheatType, timestamp: new Date() } },
    },
    { new: true }
  );

  if (!attempt) {
    throw new Error("Attempt not found or invalid session");
  }

  return attempt;
};

export const getFinalExamResultService = async (examId, studentId) => {
  const exam = await Exam.findById(examId).select("scorePolicy attemptsAllowed status");
  if (!exam) throw new Error("Exam not found");

  const validAttempts = await ExamAttempt.find({
    examId,
    studentId,
    status: { $in: ["GRADED", "PARTIALLY_GRADED", "SUBMITTED"] },
    score: { $ne: null },
  }).sort({ attemptNumber: -1 });

  const totalAttempts = await ExamAttempt.countDocuments({ examId, studentId });

  let finalScore = null;

  if (validAttempts.length > 0) {
    if (exam.scorePolicy === "HIGHEST") {
      finalScore = Math.max(...validAttempts.map((a) => a.score));
    } else if (exam.scorePolicy === "LATEST") {
      finalScore = validAttempts[0].score;
    }
  }

  return {
    finalScore,
    scorePolicy: exam.scorePolicy,
    attemptsUsed: totalAttempts,
    attemptsAllowed: exam.attemptsAllowed,
  };
};

/**
 * Chấm bài tự động (được gọi bởi auto-submit cron job hoặc lazy submit).
 * Đọc answers từ attempt.questions[].answer (không nhận tham số answers[]).
 */
export const gradeSubmission = async (attemptId) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) return null;
  if (attempt.status !== "IN_PROGRESS") return attempt;

  await _gradeAttempt(attempt);
  return attempt;
};
