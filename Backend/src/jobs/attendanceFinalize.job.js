// Tự động chốt sổ điểm danh cho buổi học TRỰC TUYẾN đã kết thúc — đặc tả nghiệp vụ mục 7
// (BR-7.3: trạng thái tự động chốt sau khi buổi kết thúc 15 phút, không tính realtime).
//
// Chỉ xử lý buổi có onlineMeeting.roomId (đã thực sự mở phòng Jitsi qua startSessionService) —
// đây là tín hiệu đáng tin cậy duy nhất để phân biệt buổi online với buổi offline, vì
// ClassSession không có field mode riêng (mode nằm ở Class, buổi offline sẽ không có roomId).
import ClassSession from "#modules/classSession/classSession.model.js";
import attendanceService from "#modules/attendance/attendance.service.js";
import { logger } from "#shared/utils/logger.js";

const FINALIZE_GRACE_MS = 15 * 60 * 1000;

/**
 * Tìm các buổi học trực tuyến đã COMPLETED, kết thúc quá 15 phút, và chưa được chốt sổ.
 */
export const findSessionsToFinalize = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - FINALIZE_GRACE_MS);
  return ClassSession.find({
    status: "COMPLETED",
    isDeleted: false,
    attendanceFinalizedAt: null,
    "onlineMeeting.roomId": { $ne: null },
    actualEndAt: { $ne: null, $lte: cutoff },
  })
    .select("_id")
    .lean();
};

/**
 * Chạy chốt sổ cho tất cả buổi đủ điều kiện — 1 buổi lỗi không chặn các buổi còn lại.
 */
export const runAttendanceFinalize = async (now = new Date()) => {
  const sessions = await findSessionsToFinalize(now);
  if (sessions.length === 0) return { finalized: 0, failed: 0 };

  let finalized = 0;
  let failed = 0;

  for (const session of sessions) {
    try {
      await attendanceService.finalizeSessionAttendance(session._id);
      finalized += 1;
    } catch (error) {
      failed += 1;
      logger.error(`[ATTENDANCE-FINALIZE] Không chốt được buổi ${session._id}: ${error.message}`);
    }
  }

  return { finalized, failed };
};

export default { runAttendanceFinalize, findSessionsToFinalize };
