import mongoose from "mongoose";

/**
 * Sinh roomName chuẩn độc nhất cho từng phiên LiveSession của 8x8 JaaS.
 * Format: lms_<classId>_<liveSessionId>
 *
 * @param {string | mongoose.Types.ObjectId} classId
 * @param {string | mongoose.Types.ObjectId} liveSessionId
 * @returns {string} roomName chuẩn ASCII không chứa khoảng trắng hay ký tự đặc biệt
 */
export const generateLiveSessionRoomName = (classId, liveSessionId) => {
  if (!classId || !liveSessionId) {
    throw new Error("[LiveSessionHelper] classId và liveSessionId là bắt buộc để sinh roomName!");
  }

  const strClassId = String(classId).trim();
  const strSessionId = String(liveSessionId).trim();

  if (
    !mongoose.Types.ObjectId.isValid(strClassId) ||
    !mongoose.Types.ObjectId.isValid(strSessionId)
  ) {
    throw new Error("[LiveSessionHelper] classId hoặc liveSessionId không phải ObjectId hợp lệ!");
  }

  return `lms_${strClassId}_${strSessionId}`;
};
