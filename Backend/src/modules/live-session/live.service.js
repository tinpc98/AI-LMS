import mongoose from "mongoose";
import { User } from "#modules/auth";
import ClassSession from "../classSession/classSession.model.js";
import { Class as classModel } from "#modules/class";
import { LiveError, LIVE_ERROR_CODES } from "./live.validator.js";
import { notificationService } from "#modules/notification";
import { generateLiveSessionRoomName } from "./liveSessionHelper.js";

/**
 * Service xử lý Business Logic của LiveSession -> ClassSession
 */

export const startSessionService = async ({
  sessionId,
  userId,
  io,
}) => {
  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new LiveError("sessionId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_SESSION_ID);
  }

  const session = await ClassSession.findById(sessionId).populate("classId");
  if (!session || session.isDeleted) {
    throw new LiveError(
      "Buổi học không tồn tại hoặc đã bị xóa!",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_FOUND
    );
  }

  const classInfo = session.classId;
  if (!classInfo || classInfo.isDeleted) {
    throw new LiveError("Lớp học không tồn tại", 404, LIVE_ERROR_CODES.CLASS_NOT_FOUND);
  }

  if (classInfo.mode !== "ONLINE") {
    throw new LiveError("Không thể bắt đầu Live Meeting cho lớp OFFLINE", 400);
  }

  if (session.status === "CANCELLED") {
    throw new LiveError("Không thể bắt đầu buổi học đã bị hủy", 400);
  }

  // Teacher Start Window (e.g. 30 mins before)
  const now = new Date();
  const startWindow = new Date(session.scheduledStartAt.getTime() - 30 * 60000);
  if (now < startWindow) {
    throw new LiveError("Chưa tới giờ chuẩn bị lớp học (cho phép 30 phút trước khi bắt đầu)", 400);
  }

  if (session.status === "COMPLETED") {
    throw new LiveError("Buổi học đã kết thúc", 400);
  }

  session.status = "IN_PROGRESS";
  session.actualStartAt = session.actualStartAt || now;
  
  const roomName = generateLiveSessionRoomName(classInfo._id.toString(), session._id.toString());
  session.onlineMeeting = {
    roomId: roomName,
    status: "OPEN",
    startedAt: session.actualStartAt,
  };

  await session.save();

  // Thêm checkedInAt cho TeacherAttendance
  try {
    const { default: TeacherAttendance } = await import("../teacherAttendance/teacherAttendance.model.js");
    await TeacherAttendance.updateOne(
      { sessionId: session._id, teacherId: classInfo.teacherId },
      { $set: { checkedInAt: now } }
    );
  } catch (err) {
    console.error("Lỗi cập nhật checkedInAt TeacherAttendance:", err);
  }

  if (io) {
    io.to(`room_class_${classInfo._id}`).emit("LIVE_SESSION_STARTED", {
      classId: classInfo._id.toString(),
      sessionId: session._id.toString(),
      roomName: roomName,
      status: session.status,
      actualStart: session.actualStartAt,
      timestamp: new Date().toISOString(),
    });
  }

  return session;
};

export const getActiveSessionService = async (classId) => {
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return null;
  }

  const activeSession = await ClassSession.findOne({ classId, status: "IN_PROGRESS", isDeleted: false })
    .populate("teacherId", "fullName name email")
    .lean();

  return activeSession;
};

export const getSessionDetailService = async (sessionId) => {
  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new LiveError("sessionId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_SESSION_ID);
  }

  const session = await ClassSession.findOne({ _id: sessionId, isDeleted: false })
    .populate("teacherId", "fullName name email")
    .lean();

  if (!session) {
    throw new LiveError(
      "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_FOUND
    );
  }

  return session;
};

export const getSessionHistoryService = async (classId, queryOptions = {}) => {
  // Now replaced by ClassSession controller, but we keep this for backwards compatibility if needed
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    throw new LiveError("classId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_CLASS_ID);
  }
  const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
  const skip = (page - 1) * limit;

  const filter = { classId, isDeleted: false };
  if (queryOptions.status) {
    filter.status = queryOptions.status;
  }

  const [items, totalItems] = await Promise.all([
    ClassSession.find(filter)
      .sort({ sessionNumber: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const endSessionService = async ({ sessionId, classId, userId, io }) => {
  let queryFilter = { status: "IN_PROGRESS", isDeleted: false };

  if (sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new LiveError("sessionId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_SESSION_ID);
    }
    queryFilter._id = sessionId;
  } else if (classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new LiveError("classId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_CLASS_ID);
    }
    queryFilter.classId = classId;
  }

  const session = await ClassSession.findOne(queryFilter).populate("classId");
  if (!session) {
    throw new LiveError(
      "Không có buổi học nào đang diễn ra để kết thúc.",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_ACTIVE
    );
  }

  session.status = "COMPLETED";
  session.actualEndAt = new Date();
  if (session.onlineMeeting) {
    session.onlineMeeting.status = "CLOSED";
    session.onlineMeeting.endedAt = session.actualEndAt;
  }
  await session.save();

  // Thêm checkedOutAt cho TeacherAttendance
  try {
    const { default: TeacherAttendance } = await import("../teacherAttendance/teacherAttendance.model.js");
    await TeacherAttendance.updateOne(
      { sessionId: session._id },
      { $set: { checkedOutAt: session.actualEndAt } }
    );
  } catch (err) {
    console.error("Lỗi cập nhật checkedOutAt TeacherAttendance:", err);
  }

  const targetClassId = session.classId._id.toString();
  if (io) {
    io.to(`room_class_${targetClassId}`).emit("LIVE_SESSION_ENDED", {
      classId: targetClassId,
      sessionId: session._id.toString(),
      status: "COMPLETED",
      actualEnd: session.actualEndAt,
      timestamp: new Date().toISOString(),
    });
  }

  return session;
};
