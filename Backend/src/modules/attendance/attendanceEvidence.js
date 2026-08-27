// TÍNH NĂNG MỚI (mục 7 — điểm danh tự động lớp học trực tuyến, đặc tả nghiệp vụ).
//
// Toàn bộ logic tính toán THUẦN (không đụng DB) — tách riêng để test được không cần mock
// Mongoose, và để attendance.service.js#finalizeSessionAttendanceService chỉ còn việc đọc/ghi.
const MINUTE_MS = 60 * 1000;

/** Ngưỡng phân loại trạng thái — đặc tả mục 7.1. */
export const PRESENT_RATIO_THRESHOLD = 0.7;
export const PARTIAL_RATIO_THRESHOLD = 0.4;
export const LATE_DELAY_MINUTES = 10;

/**
 * Hợp nhất (union) các khoảng [joinAt, leaveAt] — cộng dồn kiểu cũ (Σ duration từng phiên) sẽ
 * đếm trùng phần thời gian 2 thiết bị cùng online hoặc rejoin chồng lấn; union thì không.
 * Phiên có leaveAt=null (chưa đóng, VD mất kết nối đột ngột) coi như kết thúc tại `now`.
 */
export const computeUnionSeconds = (sessions, now = new Date()) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;

  const intervals = sessions
    .map((s) => ({
      start: new Date(s.joinAt).getTime(),
      end: (s.leaveAt ? new Date(s.leaveAt) : now).getTime(),
    }))
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) return 0;

  let totalMs = 0;
  let curStart = intervals[0].start;
  let curEnd = intervals[0].end;

  for (let i = 1; i < intervals.length; i++) {
    const iv = intervals[i];
    if (iv.start <= curEnd) {
      // Chồng lấn hoặc liền kề — gộp vào khoảng hiện tại thay vì cộng riêng.
      curEnd = Math.max(curEnd, iv.end);
    } else {
      totalMs += curEnd - curStart;
      curStart = iv.start;
      curEnd = iv.end;
    }
  }
  totalMs += curEnd - curStart;

  return Math.round(totalMs / 1000);
};

/** Thời điểm vào lần đầu — luôn tính lại từ dữ liệu gốc, không lưu trạng thái rời rạc dễ lệch. */
export const computeFirstJoinAt = (sessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;
  const joinTimes = sessions.map((s) => new Date(s.joinAt).getTime());
  return new Date(Math.min(...joinTimes));
};

/**
 * Phân loại trạng thái tự động theo đặc tả mục 7.1.
 * @param {number} attendedRatio - 0..1 (KHÔNG phải phần trăm)
 * @param {number} firstJoinDelaySeconds - luôn >= 0 (đã clamp)
 */
export const resolveAutoStatus = (attendedRatio, firstJoinDelaySeconds) => {
  if (attendedRatio >= PRESENT_RATIO_THRESHOLD) {
    return firstJoinDelaySeconds > LATE_DELAY_MINUTES * 60 ? "LATE" : "PRESENT";
  }
  if (attendedRatio >= PARTIAL_RATIO_THRESHOLD) return "PARTIAL";
  return "ABSENT";
};

/**
 * Tính toàn bộ kết quả điểm danh tự động cho 1 học sinh từ evidence.sessions thô.
 * @param {{sessions: Array<{joinAt:Date, leaveAt:?Date}>}} evidence
 * @param {Date} sessionActualStartAt
 * @param {Date} sessionActualEndAt
 * @param {Date} now
 */
export const computeAttendanceResult = (
  evidence,
  sessionActualStartAt,
  sessionActualEndAt,
  now = new Date()
) => {
  const sessions = evidence?.sessions || [];
  const sessionDurationSeconds = Math.max(
    0,
    Math.round(
      (new Date(sessionActualEndAt).getTime() - new Date(sessionActualStartAt).getTime()) / 1000
    )
  );

  const attendedSeconds = computeUnionSeconds(sessions, now);
  const attendedRatio = sessionDurationSeconds > 0 ? attendedSeconds / sessionDurationSeconds : 0;

  const firstJoinAt = computeFirstJoinAt(sessions);
  // Học sinh vào trước giờ -> delay = 0, không âm.
  const firstJoinDelaySeconds = firstJoinAt
    ? Math.max(
        0,
        Math.round((firstJoinAt.getTime() - new Date(sessionActualStartAt).getTime()) / 1000)
      )
    : null;

  const autoStatus = resolveAutoStatus(
    attendedRatio,
    firstJoinDelaySeconds ?? Number.MAX_SAFE_INTEGER
  );

  return {
    attendedSeconds,
    attendedRatio: Math.round(attendedRatio * 1000) / 10, // lưu dạng 0-100, 1 chữ số thập phân
    firstJoinDelaySeconds,
    autoStatus,
  };
};
