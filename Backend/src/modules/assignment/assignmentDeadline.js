// Hạn nộp bài của một lượt làm Assignment — nguồn sự thật duy nhất, phía máy chủ.
//
// SOURCE OF TRUTH: attempt.expiresAt (đã được tính và lưu lúc startAttempt).
//
// Mirror đúng exam-attempt/attemptDeadline.js — không tính lại startedAt + duration vì
// expiresAt đã được tính đúng lúc tạo attempt, tránh mọi sai lệch nếu duration bị sửa sau khi
// học sinh đã bắt đầu làm bài.
const MINUTE_MS = 60 * 1000;

/** Ân hạn cho độ trễ mạng và lệch đồng hồ máy khách. */
export const GRACE_PERIOD_MS = 2 * MINUTE_MS;

/** Dung sai nộp muộn tối đa cho phép. */
export const LATE_SUBMISSION_TOLERANCE_MS = 60 * 1000;

/**
 * Lấy deadline từ attempt.expiresAt (field chính thức).
 * Fallback về startedAt + duration nếu expiresAt chưa có (trường hợp legacy).
 */
export const resolveAttemptDeadline = (attempt, assignmentDurationMinutes) => {
  if (attempt?.expiresAt) {
    return new Date(attempt.expiresAt);
  }
  if (attempt?.startedAt && assignmentDurationMinutes) {
    return new Date(new Date(attempt.startedAt).getTime() + assignmentDurationMinutes * MINUTE_MS);
  }
  return null;
};

/**
 * Bài nộp có muộn không, và muộn bao nhiêu giây (đã trừ ân hạn).
 */
export const evaluateLateness = (attempt, assignmentDurationMinutes, submittedAt = new Date()) => {
  const deadline = resolveAttemptDeadline(attempt, assignmentDurationMinutes);
  if (!deadline) return { isLate: false, lateBySeconds: 0, deadline: null };

  const overdueMs = new Date(submittedAt).getTime() - deadline.getTime() - GRACE_PERIOD_MS;

  return {
    isLate: overdueMs > 0,
    lateBySeconds: overdueMs > 0 ? Math.round(overdueMs / 1000) : 0,
    deadline,
  };
};
