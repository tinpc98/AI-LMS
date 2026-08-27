// TÍNH NĂNG MỚI (mục 4 + phần "Learning Streak" còn thiếu của mục 5) — logic tính streak THUẦN,
// không đụng DB, mirror cách tách lessonBlockProgress.js/attendanceEvidence.js.

/** "YYYY-MM-DD" theo giờ UTC — khoá ngày dùng để so khớp "có hoạt động ngày này hay không". */
export const toUtcDateKey = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Học sinh có đủ N ngày hoạt động liên tục, kết thúc đúng vào `endDate`, hay không — dùng
 * `endDate` = "hôm qua" (ngày gần nhất đã hoàn tất) khi job chạy vào đầu ngày hôm sau, tránh
 * streak bị coi là "đứt" chỉ vì học sinh chưa kịp hoạt động trong ngày hôm nay.
 */
export const hasStreakEndingOn = (activityDateKeySet, endDate, requiredDays) => {
  for (let i = 0; i < requiredDays; i++) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    if (!activityDateKeySet.has(toUtcDateKey(d))) return false;
  }
  return true;
};

/** "Hôm qua" theo giờ UTC, tính từ thời điểm job chạy — ngày gần nhất chắc chắn đã kết thúc. */
export const yesterdayUtc = (now = new Date()) => {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
};
