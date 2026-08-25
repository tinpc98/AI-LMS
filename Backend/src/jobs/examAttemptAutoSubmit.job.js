// Tự động nộp bài cho phiên thi đã hết giờ (chính sách 1A).
//
// Điều kiện tiên quyết: PATCH /api/exam-attempts/:id/answers đã được đăng ký,
// và frontend đẩy câu trả lời lên server ngay khi chọn (useAnswerAutosave).
//
// Bài làm được chấm theo attempt.questions[i].answer (canonical storage).
// Không còn dùng attempt.answers[] hay attempt.startTime.
//
// Tìm phiên quá hạn: so sánh attempt.expiresAt < now - GRACE_PERIOD_MS.
// Dùng aggregate $lookup để tránh tải toàn bộ collection về JS.
import ExamAttempt from "#modules/exam-attempt/examAttempt.model.js";
import { gradeSubmission } from "#modules/exam-attempt/examAttempt.service.js";
import { logger } from "#shared/utils/logger.js";

const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 phút ân hạn (khớp với draftAnswers.service)

/**
 * Tìm các phiên IN_PROGRESS đã quá expiresAt + GRACE_PERIOD_MS.
 */
export const findOverdueAttempts = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS);
  return ExamAttempt.find({
    status: "IN_PROGRESS",
    expiresAt: { $lt: cutoff },
  })
    .select("_id questions expiresAt startedAt")
    .lean();
};

/**
 * Chạy auto-submit cho tất cả phiên quá hạn.
 *
 * Mỗi phiên được chấm riêng qua gradeSubmission (có transaction nội bộ).
 * Một phiên hỏng không chặn các phiên còn lại.
 */
export const runExamAttemptAutoSubmit = async (now = new Date()) => {
  const overdue = await findOverdueAttempts(now);
  if (overdue.length === 0) return { submitted: 0, failed: 0 };

  let submitted = 0;
  let failed = 0;

  for (const attempt of overdue) {
    try {
      // gradeSubmission đọc attempt.questions[].answer trực tiếp
      await gradeSubmission(attempt._id);
      submitted += 1;
    } catch (error) {
      failed += 1;
      logger.error(`[AUTO-SUBMIT] Không nộp được phiên ${attempt._id}: ${error.message}`);
    }
  }

  return { submitted, failed };
};

/** Số giây một phiên đã quá hạn expiresAt. */
export const overdueBySeconds = (attempt, now = new Date()) => {
  if (!attempt?.expiresAt) return 0;
  return Math.max(0, Math.round((now.getTime() - new Date(attempt.expiresAt).getTime()) / 1000));
};

export default { runExamAttemptAutoSubmit, findOverdueAttempts };
