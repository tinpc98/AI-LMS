// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 5) — logic tính toán THUẦN, không đụng DB, mirror cách
// tách lessonBlockProgress.js/attendanceEvidence.js: dễ test, xp.service.js chỉ còn việc đọc/ghi.

// Bảng điểm XP theo hành động — chỉ cộng khi có KẾT QUẢ ĐÃ XÁC MINH, không cộng cho hành vi
// xem/mở (nguyên tắc "NO XP for opening/viewing anything — only for completing").
export const XP_TABLE = {
  DAILY_LOGIN: 2,
  LESSON_COMPLETED: 20,
  PRACTICE_QUIZ_PASSED: 10,
  PRACTICE_QUIZ_PERFECT_BONUS: 5, // Cộng thêm khi đạt 100% (ngoài PRACTICE_QUIZ_PASSED)
  ASSIGNMENT_SUBMITTED: 15,
  ASSIGNMENT_ON_TIME_BONUS: 10,
  ASSIGNMENT_HIGH_SCORE_BONUS: 15, // Khi điểm chấm >= 80%
  EXAM_FINISHED: 30,
  ATTENDANCE_PRESENT: 10,
  QA_POST_PINNED: 15,
  LEARNING_STREAK_7_DAY: 50,
  COURSE_COMPLETED: 200,
};

export const QA_POST_PINNED_DAILY_LIMIT = 3;

// [GT] — mức trần hợp lý, chưa có số thật từ nghiệp vụ; chặn 1 học sinh cày điểm bằng cách lặp
// hành động trong thời gian ngắn.
export const DAILY_XP_CAP = 300;

/**
 * Số XP thực tế được phép cộng thêm hôm nay, sau khi đã trừ trần — không bao giờ âm.
 */
export const clampToDailyCap = (nominalXp, todayTotalSoFar) => {
  const remaining = DAILY_XP_CAP - todayTotalSoFar;
  return Math.max(0, Math.min(nominalXp, remaining));
};

/**
 * Level = luỹ kế XP theo công thức XP_needed(L) = 100 * L^1.5 (XP cần để lên level L+1 từ L).
 * Tính level hiện tại từ tổng XP trọn đời bằng cách trừ dần — số level hữu hạn nhỏ nên vòng lặp
 * đơn giản là đủ, không cần công thức nghịch đảo hay bảng tra.
 */
export const computeXpForNextLevel = (currentLevel) =>
  Math.round(100 * Math.pow(currentLevel, 1.5));

export const computeLevelFromXp = (totalXp) => {
  let level = 1;
  let remaining = Math.max(0, totalXp || 0);

  while (remaining >= computeXpForNextLevel(level)) {
    remaining -= computeXpForNextLevel(level);
    level += 1;
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: computeXpForNextLevel(level),
  };
};
