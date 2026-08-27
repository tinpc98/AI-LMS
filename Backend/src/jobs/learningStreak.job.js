// TÍNH NĂNG MỚI — mục 5 (50 XP "Learning Streak") + mục 4 (badge "Bền bỉ"). Streak là cột mốc
// duy nhất trong cả 2 đặc tả KHÔNG có 1 sự kiện đơn lẻ nào để hook vào (chỉ xác nhận được khi
// nhìn lại lịch sử nhiều ngày) — nên cần 1 job chạy hàng ngày, khác mọi badge/XP còn lại (đều
// event-driven, chấm ngay lúc sự kiện xảy ra).
// Import trực tiếp file (không qua #modules/badge) — barrel đó còn re-export
// learningRanking.service.js (nặng hơn nhiều so với những gì job này cần).
import LearningActivity from "#modules/badge/learningActivity.model.js";
import { awardXpService } from "#modules/badge/xp.service.js";
import { XP_TABLE } from "#modules/badge/xp.js";
import { checkAndAwardPersistentBadge } from "#modules/badge/badgeAward.service.js";
import { toUtcDateKey, hasStreakEndingOn, yesterdayUtc } from "#modules/badge/streak.js";
import { PERSISTENT_STREAK_DAYS } from "#modules/badge/badgeDefinitions.js";
import { logger } from "#shared/utils/logger.js";

/**
 * Học sinh có ít nhất 1 hoạt động (bất kỳ activityType nào) trong N ngày gần nhất — ứng viên để
 * kiểm streak. Học sinh im lặng lâu hơn N ngày chắc chắn không thể có streak N ngày liên tục nên
 * không cần đưa vào truy vấn, giữ tập ứng viên nhỏ.
 */
export const findStreakCandidateIds = async (now = new Date()) => {
  const windowStart = new Date(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - PERSISTENT_STREAK_DAYS);

  return LearningActivity.distinct("studentId", { createdAt: { $gte: windowStart } });
};

/**
 * Chạy kiểm streak cho toàn bộ ứng viên — 1 học sinh lỗi không chặn các học sinh còn lại.
 */
export const runLearningStreakCheck = async (now = new Date()) => {
  const candidateIds = await findStreakCandidateIds(now);
  if (candidateIds.length === 0) return { checked: 0, awarded: 0, failed: 0 };

  const endDate = yesterdayUtc(now);
  const windowStart = new Date(endDate);
  windowStart.setUTCDate(windowStart.getUTCDate() - (PERSISTENT_STREAK_DAYS - 1));

  let awarded = 0;
  let failed = 0;

  for (const studentId of candidateIds) {
    try {
      const activities = await LearningActivity.find({
        studentId,
        createdAt: { $gte: windowStart, $lte: now },
      })
        .select("createdAt classId")
        .sort({ createdAt: -1 })
        .lean();

      if (activities.length === 0) continue;

      const dateKeys = new Set(activities.map((a) => toUtcDateKey(a.createdAt)));
      if (!hasStreakEndingOn(dateKeys, endDate, PERSISTENT_STREAK_DAYS)) continue;

      // classId account-wide không có 1 lớp "chính thức" duy nhất — dùng lớp của hoạt động gần
      // nhất (đã sort desc) làm nơi gắn sự kiện XP, chấp nhận được vì chỉ ảnh hưởng bảng xếp
      // hạng tuần của 1 lớp, không ảnh hưởng badge (badge không gắn lớp).
      const classId = activities[0].classId;
      const endDateKey = toUtcDateKey(endDate);

      await awardXpService({
        studentId,
        classId,
        activityType: "Learning Streak",
        sourceRef: `streak:${studentId}:${endDateKey}`,
        xpAmount: XP_TABLE.LEARNING_STREAK_7_DAY,
      });
      await checkAndAwardPersistentBadge(studentId);
      awarded += 1;
    } catch (error) {
      failed += 1;
      logger.error(
        `[LEARNING-STREAK] Không kiểm được streak cho học sinh ${studentId}: ${error.message}`
      );
    }
  }

  return { checked: candidateIds.length, awarded, failed };
};

export default { runLearningStreakCheck, findStreakCandidateIds };
