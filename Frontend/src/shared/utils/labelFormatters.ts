/**
 * Module nhãn dùng chung (Label Formatters) cho EduSpace Frontend.
 * Đảm bảo mọi giá trị Enum kỹ thuật từ backend được chuyển đổi sang nhãn tiếng Việt chuẩn xác.
 * Cấu trúc hàm hóa (functional) giúp dễ dàng chuyển đổi sang đa ngôn ngữ (i18n) trong tương lai.
 */

// 1. Trạng thái lớp học (Class Status)
export const CLASS_STATUS_LABELS: Record<string, string> = {
  Draft: "Bản nháp",
  Ready: "Sắp khai giảng",
  Upcoming: "Sắp khai giảng",
  Ongoing: "Đang diễn ra",
  Active: "Đang diễn ra",
  Completed: "Đã kết thúc",
  Cancelled: "Đã hủy",
  Archived: "Lưu trữ",
  Inactive: "Tạm dừng",
};

export function formatClassStatus(status?: string): string {
  if (!status) return "Không xác định";
  return CLASS_STATUS_LABELS[status] || status;
}

// 2. Hình thức học (Learning Mode)
export const LEARNING_MODE_LABELS: Record<string, string> = {
  Offline: "Tại lớp",
  Online: "Trực tuyến",
  Hybrid: "Kết hợp",
};

export function formatLearningMode(mode?: string): string {
  if (!mode) return "Tại lớp";
  return LEARNING_MODE_LABELS[mode] || mode;
}

// 3. Thứ trong tuần (Days of Week)
export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

export const FULL_DAY_OF_WEEK_LABELS: Record<string, string> = {
  Monday: "Thứ Hai",
  Tuesday: "Thứ Ba",
  Wednesday: "Thứ Tư",
  Thursday: "Thứ Năm",
  Friday: "Thứ Sáu",
  Saturday: "Thứ Bảy",
  Sunday: "Chủ Nhật",
};

export function formatDayOfWeek(day?: string, full: boolean = false): string {
  if (!day) return "";
  const map = full ? FULL_DAY_OF_WEEK_LABELS : DAY_OF_WEEK_LABELS;
  return map[day] || day;
}

export function formatScheduleDays(days?: string[], full: boolean = false): string {
  if (!Array.isArray(days) || days.length === 0) return "Chưa có lịch";
  return days.map((d) => formatDayOfWeek(d, full)).join(", ");
}

// 4. Trạng thái học sinh trong lớp (Student Enrollment Status)
export const STUDENT_STATUS_LABELS: Record<string, string> = {
  Enrolled: "Đang học",
  Reserved: "Bảo lưu",
  Transferred: "Chuyển lớp",
  Dropped: "Đã thôi học",
};

export function formatStudentStatus(status?: string): string {
  if (!status) return "Không xác định";
  return STUDENT_STATUS_LABELS[status] || status;
}

// 5. Trạng thái điểm danh (Attendance Status)
export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  Present: "Có mặt",
  Absent: "Vắng mặt",
  Late: "Đi muộn",
  Excused: "Có phép",
};

export function formatAttendanceStatus(status?: string): string {
  if (!status) return "Chưa điểm danh";
  return ATTENDANCE_STATUS_LABELS[status] || status;
}

// 6. Trạng thái nộp bài tập (Assignment / Submission Status)
export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: "Đã nộp",
  SUBMITTED: "Đã nộp",
  late: "Nộp muộn",
  LATE: "Nộp muộn",
  graded: "Đã chấm",
  GRADED: "Đã chấm",
  withdrawn: "Đã thu hồi",
  WITHDRAWN: "Đã thu hồi",
  resubmitted: "Nộp lại",
  RESUBMITTED: "Nộp lại",
  pending: "Chưa nộp",
  PENDING: "Chưa nộp",
  overdue: "Quá hạn",
  OVERDUE: "Quá hạn",
};

export function formatSubmissionStatus(status?: string): string {
  if (!status) return "Chưa nộp";
  return SUBMISSION_STATUS_LABELS[status] || status;
}

// 7. Trạng thái đề thi & bài thi (Exam & Exam Attempt Status)
export const EXAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã công bố",
  COMPLETED: "Đã hoàn thành",
  IN_PROGRESS: "Đang làm bài",
  SUBMITTED: "Đã nộp bài",
  PARTIALLY_GRADED: "Đã chấm một phần",
  GRADED: "Đã chấm điểm",
  NOT_STARTED: "Chưa bắt đầu",
};

export function formatExamStatus(status?: string): string {
  if (!status) return "Không xác định";
  return EXAM_STATUS_LABELS[status] || status;
}

// 8. Trạng thái buổi học trực tuyến (Live Session Status)
export const LIVE_SESSION_STATUS_LABELS: Record<string, string> = {
  Scheduled: "Sắp diễn ra",
  Live: "Đang diễn ra",
  Completed: "Đã kết thúc",
  Cancelled: "Đã hủy",
};

export function formatLiveSessionStatus(status?: string): string {
  if (!status) return "Không xác định";
  return LIVE_SESSION_STATUS_LABELS[status] || status;
}

// 9. Mức độ đánh giá năng lực học tập (Learning Score Level)
export const LEARNING_LEVEL_LABELS: Record<string, string> = {
  Excellent: "Xuất sắc",
  Good: "Khá",
  Average: "Trung bình",
  "Needs Improvement": "Cần cải thiện",
};

export function formatLearningLevel(level?: string): string {
  if (!level) return "Chưa đánh giá";
  return LEARNING_LEVEL_LABELS[level] || level;
}
