/**
/**
 * Response Mapper chuẩn cho LiveSession DTO (Data Transfer Object)
 * Loạt bỏ hoàn toàn internal metadata (__v, password, private key)
 * và giữ lại alias `meetingRoomId` cho compatibility v1 nếu cần.
 * 
 * @param {Object} session Document Mongoose hoặc Plain JS Object của LiveSession
 * @param {Object} [options] Tùy chọn format (e.g. isLegacy: boolean)
 * @returns {Object} LiveSession DTO chuẩn
 */
export const mapLiveSessionResponse = (session, options = {}) => {
  if (!session) return null;
  const doc = session.toObject ? session.toObject() : session;
  const room = doc.roomName || doc.meetingRoomId || "";

  const mapped = {
    id: doc._id?.toString() || doc.id,
    classId: doc.classId?.toString() || doc.classId,
    roomName: room,
    sessionNumber: doc.sessionNumber,
    title: doc.title,
    status: doc.status,
    scheduledStart: doc.scheduledStart || null,
    scheduledEnd: doc.scheduledEnd || null,
    actualStart: doc.actualStart || null,
    actualEnd: doc.actualEnd || null,
    createdBy:
      typeof doc.createdBy === "object" && doc.createdBy !== null
        ? {
            id: doc.createdBy._id?.toString() || doc.createdBy.id,
            name: doc.createdBy.fullName || doc.createdBy.name || "Teacher",
          }
        : doc.createdBy,
    endedBy:
      typeof doc.endedBy === "object" && doc.endedBy !== null
        ? {
            id: doc.endedBy._id?.toString() || doc.endedBy.id,
            name: doc.endedBy.fullName || doc.endedBy.name || "Teacher",
          }
        : doc.endedBy,
    recordingUrl: doc.recordingUrl || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  // Nếu gọi qua adapter legacy, gắn thêm alias meetingRoomId
  if (options.isLegacy) {
    mapped.meetingRoomId = room;
  }

  return mapped;
};
