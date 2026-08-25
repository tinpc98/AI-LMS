// Hạn nộp bài của một lượt thi — nguồn sự thật duy nhất, phía máy chủ.
//
// SOURCE OF TRUTH: attempt.expiresAt (đã được tính và lưu lúc startExam).
//
// Không cần tính lại startedAt + duration vì expiresAt đã được tính đúng lúc tạo attempt.
// Dùng expiresAt trực tiếp đơn giản hơn và tránh mọi sai lệch nếu duration được sửa sau khi
// học sinh đã bắt đầu thi.
const MINUTE_MS = 60 * 1000;

/**
 * Ân hạn cho độ trễ mạng và lệch đồng hồ máy khách.
 */
export const GRACE_PERIOD_MS = 2 * MINUTE_MS;

/**
 * Dung sai nộp muộn tối đa cho phép.
 */
export const LATE_SUBMISSION_TOLERANCE_MS = 60 * 1000;

/**
 * Lấy deadline từ attempt.expiresAt (field chính thức).
 * Fallback về startedAt + duration nếu expiresAt chưa có (trường hợp legacy).
 */
export const resolveAttemptDeadline = (attempt, examDurationMinutes) => {
  if (attempt?.expiresAt) {
    return new Date(attempt.expiresAt);
  }
  // Legacy fallback chỉ dùng khi expiresAt chưa có
  if (attempt?.startedAt && examDurationMinutes) {
    return new Date(new Date(attempt.startedAt).getTime() + examDurationMinutes * MINUTE_MS);
  }
  return null;
};

/**
 * Bài nộp có muộn không, và muộn bao nhiêu giây (đã trừ ân hạn).
 */
export const evaluateLateness = (attempt, examDurationMinutes, submittedAt = new Date()) => {
  const deadline = resolveAttemptDeadline(attempt, examDurationMinutes);
  if (!deadline) return { isLate: false, lateBySeconds: 0, deadline: null };

  const overdueMs = new Date(submittedAt).getTime() - deadline.getTime() - GRACE_PERIOD_MS;

  return {
    isLate: overdueMs > 0,
    lateBySeconds: overdueMs > 0 ? Math.round(overdueMs / 1000) : 0,
    deadline,
  };
};

/**
 * Kiểm tra xem bài nộp có bị từ chối do quá hạn hay không.
 */
export const isSubmissionRejected = (attempt, examDurationMinutes, submittedAt = new Date()) => {
  const deadline = resolveAttemptDeadline(attempt, examDurationMinutes);
  if (!deadline) return { rejected: false };

  const diffMs = new Date(submittedAt).getTime() - deadline.getTime();
  if (diffMs > LATE_SUBMISSION_TOLERANCE_MS) {
    return {
      rejected: true,
      message: "Đã quá hạn nộp bài. Hệ thống không chấp nhận bài nộp muộn.",
    };
  }

  return { rejected: false };
};
