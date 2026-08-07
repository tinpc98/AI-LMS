// Hạn nộp bài của một lượt thi — nguồn sự thật duy nhất, phía máy chủ.
//
// VÌ SAO CẦN FILE NÀY (Wave 7+)
//
// Trước đây hạn nộp chỉ tồn tại trong localStorage của trình duyệt học sinh: useExamTimer tự
// tính `Date.now() + duration` lúc vào trang rồi lưu lại. Xoá localStorage là có đồng hồ mới,
// trọn thời gian.
//
// Hook có sẵn tham số nhận mốc kết thúc tuyệt đối từ máy chủ, nhưng endpoint chi tiết lượt thi
// CHƯA BAO GIỜ trả trường đó — nên tham số ấy là mã chết ở cả hai phía.
//
// Ba nơi cần cùng một phép tính này (endpoint chi tiết, lúc chấm bài, và cron dò bài kẹt), nên
// đặt thành hàm thuần dùng chung thay vì mỗi chỗ tự tính.
const MINUTE_MS = 60 * 1000;

/**
 * Ân hạn cho độ trễ mạng và lệch đồng hồ máy khách.
 *
 * Đã có sẵn trong gradeSubmission từ trước với cùng giá trị 2 phút; đưa ra đây để cả hệ thống
 * dùng chung một con số thay vì viết lại rải rác.
 */
export const GRACE_PERIOD_MS = 2 * MINUTE_MS;

/**
 * Dung sai nộp muộn tối đa cho phép.
 * Nếu vượt quá khoảng này, bài nộp bị từ chối thay vì chỉ bị đánh dấu nộp muộn.
 */
export const LATE_SUBMISSION_TOLERANCE_MS = 60 * 1000;

/**
 * Thời điểm học sinh này phải nộp xong, tính từ lúc HỌ bắt đầu làm bài.
 *
 * Tính theo attempt.startTime chứ không phải exam.startTime: mỗi học sinh bấm bắt đầu ở thời
 * điểm khác nhau, và thời lượng làm bài là của từng người.
 */
export const resolveAttemptDeadline = (attemptStartTime, examDurationMinutes) => {
  if (!attemptStartTime || !examDurationMinutes) return null;
  return new Date(new Date(attemptStartTime).getTime() + examDurationMinutes * MINUTE_MS);
};

/**
 * Bài nộp có muộn không, và muộn bao nhiêu giây (đã trừ ân hạn).
 *
 * KHÔNG dùng để TỪ CHỐI bài nộp. Từ chối là một quyết định về chính sách thi cử với hậu quả
 * trực tiếp lên điểm của học sinh — mã không được tự quyết. Hàm này chỉ tạo ra DỮ KIỆN để
 * giáo viên nhìn thấy và xử lý.
 *
 * Trước đây bài nộp muộn được chấp nhận âm thầm: gradeSubmission kẹp lại endTime cho đẹp rồi
 * chấm bình thường, không để lại dấu vết nào. Giáo viên không có cách nào biết.
 */
export const evaluateLateness = (
  attemptStartTime,
  examDurationMinutes,
  submittedAt = new Date()
) => {
  const deadline = resolveAttemptDeadline(attemptStartTime, examDurationMinutes);
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
 *
 * @param {Object} attempt - Phiên làm bài.
 * @param {Object} exam - Thông tin đề thi.
 * @param {Date} submittedAt - Thời điểm nộp bài (mặc định là hiện tại).
 * @returns {Object} { rejected: boolean, message: string }
 */
export const isSubmissionRejected = (attempt, exam, submittedAt = new Date()) => {
  if (!attempt.startTime || !exam.duration) return { rejected: false };

  // Sử dụng startTime + duration (theo như quyết định của user)
  const deadline = resolveAttemptDeadline(attempt.startTime, exam.duration);
  if (!deadline) return { rejected: false };

  const diffMs = new Date(submittedAt).getTime() - deadline.getTime();
  if (diffMs > LATE_SUBMISSION_TOLERANCE_MS) {
    return {
      rejected: true,
      message: "Đã quá hạn nộp bài. Hệ thống không chấp nhận bài nộp muộn."
    };
  }

  return { rejected: false };
};
