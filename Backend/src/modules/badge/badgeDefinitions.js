// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 4) — định nghĩa THUẦN cho 8 badge học sinh. Badge chỉ
// mang tính hiển thị: KHÔNG cộng XP, KHÔNG mở khóa quyền hạn gì (tránh tính trùng với các hành
// động đã cộng XP riêng ở mục 5) — mỗi badge chỉ đơn thuần "công nhận" một cột mốc đã đạt được.
//
// Auto-award only (không có màn hình cho Admin gán tay ở MVP), event-driven (chấm ngay khi sự
// kiện xảy ra) — riêng "Bền bỉ" (streak) cần 1 job chạy hàng ngày vì bản chất "7 ngày liên tục"
// chỉ xác nhận được khi nhìn lại lịch sử, không có 1 sự kiện đơn lẻ nào để hook vào.
//
// 2 mục CHƯA xây trong đợt này (ghi chú lại thay vì đoán bừa điều kiện kích hoạt):
// - "Đồng đội": đặc tả gốc không nêu rõ hành động cụ thể nào tính là "hỗ trợ bạn học" (chưa xác
//   nhận có module Q&A/forum trong hệ thống hay không) — cần làm rõ nguồn dữ liệu trước khi xây.
// - "Tiến bộ": "điểm số cải thiện" cần định nghĩa rõ so sánh với gì (lần thi trước cùng 1
//   Exam? điểm trung bình 30 ngày? ngưỡng cải thiện bao nhiêu %?) — cần làm rõ trước khi xây.
// - Bộ badge "contributor" cho giáo viên (điều phối tài nguyên) — đặc tả gốc không mô tả chi
//   tiết, để sau khi có yêu cầu cụ thể hơn.
export const BADGE_CODES = {
  GETTING_STARTED: "GETTING_STARTED", // Khởi đầu
  DILIGENT: "DILIGENT", // Chuyên cần
  ON_TIME: "ON_TIME", // Đúng hạn
  PERSISTENT: "PERSISTENT", // Bền bỉ
  CONQUEROR: "CONQUEROR", // Chinh phục
  PERFECT_SCORE: "PERFECT_SCORE", // Điểm tuyệt đối
};

export const BADGE_DEFINITIONS = {
  [BADGE_CODES.GETTING_STARTED]: {
    title: "Khởi đầu",
    description: "Hoàn thành bài giảng đầu tiên",
    icon: "🚀",
    badgeType: "Milestone",
  },
  [BADGE_CODES.DILIGENT]: {
    title: "Chuyên cần",
    description: "Điểm danh có mặt 10 buổi học",
    icon: "📅",
    badgeType: "Achievement",
  },
  [BADGE_CODES.ON_TIME]: {
    title: "Đúng hạn",
    description: "Nộp bài tập đúng hạn 5 lần",
    icon: "⏰",
    badgeType: "Achievement",
  },
  [BADGE_CODES.PERSISTENT]: {
    title: "Bền bỉ",
    description: "Học liên tục 7 ngày không nghỉ",
    icon: "🔥",
    badgeType: "Achievement",
  },
  [BADGE_CODES.CONQUEROR]: {
    title: "Chinh phục",
    description: "Hoàn thành 100% một khóa học",
    icon: "🏆",
    badgeType: "Milestone",
  },
  [BADGE_CODES.PERFECT_SCORE]: {
    title: "Điểm tuyệt đối",
    description: "Đạt điểm tuyệt đối trong 1 bài Quiz/Bài tập/Bài thi",
    icon: "💯",
    badgeType: "Achievement",
  },
};

// Ngưỡng số lần cần đạt cho các badge dạng đếm dồn.
export const DILIGENT_ATTENDANCE_THRESHOLD = 10;
export const ON_TIME_SUBMISSION_THRESHOLD = 5;
export const PERSISTENT_STREAK_DAYS = 7;
