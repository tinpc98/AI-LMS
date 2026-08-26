// Tự động nộp bài Assignment đã hết giờ — mirror đúng examAttemptAutoSubmit.job.js (chính sách
// 1A áp dụng cho cả Exam lẫn Assignment).
//
// Tìm phiên quá hạn: so sánh attempt.expiresAt < now - GRACE_PERIOD_MS.
import AssignmentAttempt from "#modules/assignment/assignmentAttempt.model.js";
import { gradeSubmission } from "#modules/assignment/assignment.service.js";
import { logger } from "#shared/utils/logger.js";

const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 phút ân hạn (khớp examAttemptAutoSubmit.job.js)

/**
 * Tìm các phiên IN_PROGRESS đã quá expiresAt + GRACE_PERIOD_MS.
 */
export const findOverdueAttempts = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS);
  return AssignmentAttempt.find({
    status: "IN_PROGRESS",
    expiresAt: { $lt: cutoff },
  })
    .select("_id questions expiresAt startedAt")
    .lean();
};

/**
 * Chạy auto-submit cho tất cả phiên Assignment quá hạn.
 *
 * Mỗi phiên được chấm riêng qua gradeSubmission — một phiên hỏng không chặn các phiên còn lại.
 */
export const runAssignmentAttemptAutoSubmit = async (now = new Date()) => {
  const overdue = await findOverdueAttempts(now);
  if (overdue.length === 0) return { submitted: 0, failed: 0 };

  let submitted = 0;
  let failed = 0;

  for (const attempt of overdue) {
    try {
      await gradeSubmission(attempt._id);
      submitted += 1;
    } catch (error) {
      failed += 1;
      logger.error(
        `[ASSIGNMENT-AUTO-SUBMIT] Không nộp được phiên ${attempt._id}: ${error.message}`
      );
    }
  }

  return { submitted, failed };
};

export default { runAssignmentAttemptAutoSubmit, findOverdueAttempts };
