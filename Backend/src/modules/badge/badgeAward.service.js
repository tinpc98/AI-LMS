// TÍNH NĂNG MỚI (mục 4) — logic kiểm tra điều kiện + trao badge. Dùng lại LearningActivity (sổ
// cái XP đã có ở mục 5) làm NGUỒN DỮ LIỆU đếm cột mốc — không cần đếm lại từ Attendance/
// AssignmentAttempt riêng, vì mỗi sự kiện đã xác minh đều đã có đúng 1 dòng ghi nhận ở đó.
//
// awardBadge() (gamification.service.js) đã tự chống trao trùng qua unique index
// {studentId, badgeCode} — nên các hàm dưới đây có thể gọi "vô tư" mỗi khi sự kiện liên quan xảy
// ra, không cần tự kiểm tra "đã có chưa" trước.
import LearningActivity from "./learningActivity.model.js";
import gamificationService from "./gamification.service.js";
import {
  BADGE_CODES,
  BADGE_DEFINITIONS,
  DILIGENT_ATTENDANCE_THRESHOLD,
  ON_TIME_SUBMISSION_THRESHOLD,
} from "./badgeDefinitions.js";

const award = (studentId, code) => {
  const def = BADGE_DEFINITIONS[code];
  return gamificationService.awardBadge(
    studentId,
    code,
    def.badgeType,
    def.title,
    def.description,
    def.icon
  );
};

/** Khởi đầu — hoàn thành bài giảng đầu tiên. Gọi mỗi khi có 1 Lesson Completed, dedup tự nhiên. */
export const checkAndAwardGettingStartedBadge = (studentId) =>
  award(studentId, BADGE_CODES.GETTING_STARTED);

/** Điểm tuyệt đối — đạt 100% ở Practice Quiz/Assignment/Exam. Gọi khi phát hiện 1 lượt đạt 100%. */
export const checkAndAwardPerfectScoreBadge = (studentId) =>
  award(studentId, BADGE_CODES.PERFECT_SCORE);

/** Chinh phục — hoàn thành 100% một khóa học. Gọi khi phát hiện học sinh vừa hoàn thành Course. */
export const checkAndAwardConquerorBadge = (studentId) => award(studentId, BADGE_CODES.CONQUEROR);

/** Bền bỉ — học liên tục 7 ngày. Gọi từ job hàng ngày khi phát hiện streak đủ dài. */
export const checkAndAwardPersistentBadge = (studentId) => award(studentId, BADGE_CODES.PERSISTENT);

/**
 * Chuyên cần — đủ N lần điểm danh PRESENT (đếm qua LearningActivity, không đếm lại Attendance).
 * Gọi sau mỗi lần cộng XP "Attendance Present" — chỉ thực sự trao khi VỪA CHẠM ngưỡng lần đầu.
 */
export const checkAndAwardDiligentBadge = async (studentId) => {
  const count = await LearningActivity.countDocuments({
    studentId,
    activityType: "Attendance Present",
  });
  if (count >= DILIGENT_ATTENDANCE_THRESHOLD) {
    await award(studentId, BADGE_CODES.DILIGENT);
  }
};

/**
 * Đúng hạn — đủ N lần nộp bài tập đúng hạn (đếm qua sourceRef "assignment-ontime:*" trong
 * LearningActivity — mỗi dòng là 1 Assignment nộp đúng hạn, đã dedup theo assignmentId ở mục 5).
 */
export const checkAndAwardOnTimeBadge = async (studentId) => {
  const count = await LearningActivity.countDocuments({
    studentId,
    sourceRef: { $regex: /^assignment-ontime:/ },
  });
  if (count >= ON_TIME_SUBMISSION_THRESHOLD) {
    await award(studentId, BADGE_CODES.ON_TIME);
  }
};
