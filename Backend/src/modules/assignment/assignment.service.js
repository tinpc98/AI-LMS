import * as assignmentRepo from "./assignment.repository.js";
import Question from "../question/question.model.js";
import Topic from "../topic/topic.model.js";
import AssignmentAttempt from "./assignmentAttempt.model.js";
import { evaluateLateness } from "./assignmentDeadline.js";

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

  // TÍNH NĂNG MỚI: mirror examAttempt.service.js#startExamService — chặn bắt đầu làm bài ngoài
  // khung thời gian mở/đóng của Assignment (startAt/endAt), nếu giáo viên có đặt.
  const now = new Date();
  if (assignment.startAt && now < assignment.startAt) {
    const err = new Error("Assignment chưa mở, chưa thể bắt đầu làm bài.");
    err.code = "ASSIGNMENT_NOT_STARTED";
    err.startAt = assignment.startAt;
    throw err;
  }
  if (assignment.endAt && now > assignment.endAt) {
    throw new Error("Assignment đã đóng, không thể bắt đầu làm bài mới.");
  }

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

  // TÍNH NĂNG MỚI: mirror examAttempt.service.js#startExamService — expiresAt tính 1 LẦN lúc bắt
  // đầu, từ assignment.duration, không tính lại nếu duration bị sửa sau khi học sinh đã bắt đầu.
  const expiresAt = new Date(now.getTime() + assignment.duration * 60000);

  const attempt = assignmentRepo.createAttempt({
    assignmentId,
    studentId,
    attemptNumber: attemptCount + 1,
    status: "IN_PROGRESS",
    questions: attemptQuestions,
    startedAt: now,
    expiresAt,
  });

  await attempt.save();
  return attempt;
};

/**
 * Chấm tự động (MCQ/TRUE_FALSE) + xác định trạng thái + ghi nhận nộp muộn cho 1 attempt đã có
 * sẵn (KHÔNG kiểm quyền sở hữu — caller phải tự kiểm trước khi gọi). Dùng chung cho cả học sinh
 * tự nộp (submitAttemptService) lẫn cron auto-submit khi hết giờ (gradeSubmission), mirror
 * examAttempt.service.js#_gradeAttempt/gradeSubmission.
 */
const _gradeAttempt = async (attempt, submittedAt = new Date()) => {
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
  attempt.submittedAt = submittedAt;

  // TÍNH NĂNG MỚI: mirror examAttempt.service.js#_gradeAttempt — ghi nhận nộp muộn (chỉ đánh
  // dấu, không chặn nộp; chặn thật sự xảy ra sớm hơn ở saveAnswerService khi hết hạn).
  const { isLate, lateBySeconds } = evaluateLateness(attempt, null, submittedAt);
  attempt.isLate = isLate;
  attempt.lateBySeconds = lateBySeconds;

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

export const submitAttemptService = async (attemptId, studentId) => {
  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt already submitted");

  return _gradeAttempt(attempt);
};

/**
 * Chấm + nộp bài hệ thống (không kiểm quyền học sinh) — dùng bởi cron auto-submit khi hết giờ.
 * Mirror examAttempt.service.js#gradeSubmission.
 */
export const gradeSubmission = async (attemptId) => {
  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status !== "IN_PROGRESS") return attempt; // Đã nộp rồi, không làm gì thêm.

  return _gradeAttempt(attempt);
};

export const saveAnswerService = async (attemptId, questionId, studentId, answerData) => {
  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.studentId.toString() !== studentId.toString()) throw new Error("Forbidden");
  if (attempt.status !== "IN_PROGRESS")
    throw new Error("Cannot save answers for submitted attempt");

  // TÍNH NĂNG MỚI: mirror examAttempt.service.js#saveExamAnswerService — chặn lưu câu trả lời
  // sau khi đã hết hạn (cron auto-submit sẽ xử lý những lượt bị bỏ quên).
  if (new Date() > attempt.expiresAt) {
    throw new Error("Attempt has expired");
  }

  const aq = attempt.questions.find((q) => q.questionId.toString() === questionId);
  if (!aq) throw new Error("Question not found in attempt");

  aq.answer = answerData;
  await attempt.save();
  return attempt;
};

// BUG ĐÃ SỬA (race condition): trước đây đọc CẢ document trong transaction, sửa mảng
// questions[] trong bộ nhớ, rồi attempt.save({session}) ghi đè NGUYÊN mảng đó. MongoDB
// transaction chỉ phát hiện write-conflict khi ĐANG chạy — không tự retry — nên 1 trong 2 giáo
// viên chấm gần như đồng thời (2 câu essay khác nhau của cùng attempt) sẽ nhận lỗi cứng thay vì
// điểm được ghi. Sửa bằng optimistic lock trên __v (Mongoose version key có sẵn) + $set theo
// đúng index câu hỏi, retry tối đa 5 lần nếu bị chen — không cần transaction nữa vì chỉ có 1
// document bị ghi.
const MAX_GRADE_RETRIES = 5;

export const gradeEssayService = async (attemptId, questionId, score, feedback) => {
  let updated = null;

  for (let attemptNo = 0; attemptNo < MAX_GRADE_RETRIES; attemptNo++) {
    const attempt = await assignmentRepo.findAttemptById(attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status === "IN_PROGRESS") throw new Error("Attempt has not been submitted yet");

    const idx = attempt.questions.findIndex((q) => q.questionId.toString() === questionId);
    if (idx === -1) throw new Error("Question not found in attempt");
    const aq = attempt.questions[idx];
    if (aq.questionSnapshot.type !== "ESSAY" && aq.questionSnapshot.type !== "SHORT_ANSWER") {
      throw new Error("Only ESSAY or SHORT_ANSWER can be manually graded");
    }

    const awardedScore = Math.min(Math.max(0, score), aq.points); // Bound between 0 and max points
    const setOps = {
      [`questions.${idx}.score`]: awardedScore,
      [`questions.${idx}.isCorrect`]: awardedScore > 0,
    };
    if (feedback) setOps[`questions.${idx}.answer.feedback`] = feedback;

    // Tính lại tổng điểm/trạng thái trên bản chiếu = dữ liệu vừa đọc + thay đổi của request này.
    let totalScore = 0;
    let allGraded = true;
    for (let i = 0; i < attempt.questions.length; i++) {
      const q = attempt.questions[i];
      const qScore = i === idx ? awardedScore : q.score;
      const qIsCorrect = i === idx ? awardedScore > 0 : q.isCorrect;
      if (qScore !== undefined && qScore !== null) totalScore += qScore;
      if (qIsCorrect === null) allGraded = false;
    }
    setOps.score = totalScore;
    if (allGraded) setOps.status = "GRADED";

    updated = await AssignmentAttempt.findOneAndUpdate(
      { _id: attemptId, __v: attempt.__v },
      { $set: setOps, $inc: { __v: 1 } },
      { new: true }
    );

    if (updated) break; // Ghi thành công.
    // updated === null: __v đã đổi (giáo viên khác vừa ghi) — đọc lại bản mới nhất và thử lại.
  }

  if (!updated) {
    throw new Error("Có người khác vừa chấm bài này cùng lúc, vui lòng tải lại và thử lại.");
  }

  // Trigger performance integration sau khi ghi thành công
  if (updated.status === "GRADED" && !updated.performanceProcessedAt) {
    import("../performance/performance.service.js").then(({ processAttemptPerformanceService }) => {
      processAttemptPerformanceService(updated, "ASSIGNMENT")
        .then(async () => {
          await AssignmentAttempt.findByIdAndUpdate(updated._id, {
            performanceProcessedAt: new Date(),
          });
        })
        .catch((err) => console.error("Performance Process Error:", err));
    });
  }

  return updated;
};
