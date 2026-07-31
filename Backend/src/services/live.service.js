import mongoose from "mongoose";
import { User } from "#modules/auth";
import LiveSession from "../models/liveSession.model.js";
import classModel from "../models/class.model.js";
import { generateLiveSessionRoomName } from "../utils/liveSessionHelper.js";
import { mapLiveSessionResponse } from "../utils/liveSession.mapper.js";
import { LiveError, LIVE_ERROR_CODES } from "../validators/live.validator.js";
import notificationService from "./notification.service.js";
import attendanceService from "./attendance.service.js";

/**
 * Service xử lý Business Logic của LiveSession
 */

// 1. Tạo mới phiên học trực tuyến (Create Live Session)
export const createSessionService = async ({
  classId,
  title,
  scheduledStart,
  scheduledEnd,
  userId,
  io,
}) => {
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    throw new LiveError("classId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_CLASS_ID);
  }

  const classInfo = await classModel
    .findById(classId)
    .select("_id className isDeleted teacherId nextLiveSessionNumber students");
  if (!classInfo || classInfo.isDeleted) {
    throw new LiveError(
      "Lớp học không tồn tại hoặc đã bị xóa!",
      404,
      LIVE_ERROR_CODES.CLASS_NOT_FOUND
    );
  }

  // Kiểm tra xem đã có phiên Live nào đang diễn ra hay chưa
  const existingActive = await LiveSession.findOne({
    classId,
    status: "Live",
    isDeleted: false,
  }).lean();
  if (existingActive) {
    throw new LiveError(
      "Lớp học đã có một buổi học trực tuyến đang diễn ra.",
      409,
      LIVE_ERROR_CODES.SESSION_ALREADY_ACTIVE,
      mapLiveSessionResponse(existingActive)
    );
  }

  // Khởi tạo Counter nếu class chưa từng được cấp (Migration gracefully)
  if (classInfo.nextLiveSessionNumber === undefined) {
    const lastSession = await LiveSession.findOne({ classId })
      .sort({ sessionNumber: -1 })
      .select("sessionNumber")
      .lean();
    const currentMax = lastSession?.sessionNumber || 0;

    // Set initial value only if it still doesn't exist to prevent race on migration itself
    await classModel.updateOne(
      { _id: classId, nextLiveSessionNumber: { $exists: false } },
      { $set: { nextLiveSessionNumber: currentMax } }
    );
  }

  // Tăng Counter Atomically để chống mọi Race Conditions và ngắt duplicate
  const updatedClass = await classModel.findOneAndUpdate(
    { _id: classId },
    { $inc: { nextLiveSessionNumber: 1 } },
    { new: true, select: "nextLiveSessionNumber" }
  );

  const nextSessionNumber = updatedClass.nextLiveSessionNumber;

  // PHƯƠNG ÁN A: Khởi tạo ObjectId trước để sinh roomName độc nhất
  const sessionId = new mongoose.Types.ObjectId();
  const roomName = generateLiveSessionRoomName(classId, sessionId);

  const session = await LiveSession.create({
    _id: sessionId,
    classId,
    roomName,
    meetingRoomId: roomName, // Legacy alias
    sessionNumber: nextSessionNumber,
    title: title?.trim() || `Buổi ${nextSessionNumber}`,
    createdBy: userId,
    scheduledStart: scheduledStart || null,
    scheduledEnd: scheduledEnd || null,
    actualStart: new Date(),
    status: "Live",
  });

  // Re-populate creator info
  const populatedSession = await LiveSession.findById(session._id).populate(
    "createdBy",
    "fullName name email"
  );

  if (io) {
    io.to(`room_class_${classId}`).emit("LIVE_SESSION_STARTED", {
      classId: classId.toString(),
      sessionId: session._id.toString(),
      roomName: session.roomName,
      sessionNumber: session.sessionNumber,
      title: session.title,
      actualStart: session.actualStart,
      status: session.status,
      timestamp: new Date().toISOString(),
    });
    console.log(`📢 [LIVE_SERVICE] Started cho lớp ${classId} với roomName: ${session.roomName}`);
  }

  // Bắn thông báo realtime cho Student (chạy bất đồng bộ, không chờ)
  notificationService
    .notifyLiveSessionCreated({
      session: session,
      classInfo: classInfo,
      teacherInfo: populatedSession.createdBy,
      io: io,
    })
    .catch((err) => console.error("❌ Notification Error in createSessionService:", err));

  return mapLiveSessionResponse(populatedSession);
};

export const getActiveSessionService = async (classId) => {
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return null;
  }

  const activeSession = await LiveSession.findOne({ classId, status: "Live", isDeleted: false })
    .populate("createdBy", "fullName name email")
    .lean();

  return activeSession ? mapLiveSessionResponse(activeSession, { isLegacy: false }) : null;
};

// 3. Lấy chi tiết phiên học trực tuyến (Get Session Detail)
export const getSessionDetailService = async (sessionId) => {
  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new LiveError("sessionId không hợp lệ!", 400, LIVE_ERROR_CODES.INVALID_SESSION_ID);
  }

  const session = await LiveSession.findOne({ _id: sessionId, isDeleted: false })
    .populate("createdBy", "fullName name email")
    .populate("endedBy", "fullName name email")
    .lean();

  if (!session) {
    throw new LiveError(
      "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_FOUND
    );
  }

  return mapLiveSessionResponse(session);
};

// 4. Lấy lịch sử các phiên học trực tuyến của Lớp học (Get Session History)
export const getSessionHistoryService = async (classId, queryOptions = {}) => {
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
    LiveSession.find(filter)
      .sort({ sessionNumber: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "fullName name email")
      .populate("endedBy", "fullName name email")
      .lean(),
    LiveSession.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => mapLiveSessionResponse(item)),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

// 5. Kết thúc phiên học trực tuyến (End Session)
export const endSessionService = async ({ sessionId, classId, userId, io }) => {
  let queryFilter = { status: "Live", isDeleted: false };

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
  } else {
    throw new LiveError(
      "Cần cung cấp sessionId hoặc classId để kết thúc buổi học!",
      400,
      LIVE_ERROR_CODES.INVALID_SESSION_ID
    );
  }

  const session = await LiveSession.findOneAndUpdate(
    queryFilter,
    {
      status: "Completed",
      actualEnd: new Date(),
      endedBy: userId,
    },
    { new: true }
  ).populate("createdBy endedBy", "fullName name email");

  if (!session) {
    throw new LiveError(
      "Không có buổi học trực tuyến nào đang diễn ra để kết thúc.",
      404,
      LIVE_ERROR_CODES.SESSION_NOT_ACTIVE
    );
  }

  const targetClassId = session.classId?.toString();
  if (io) {
    io.to(`room_class_${targetClassId}`).emit("LIVE_SESSION_ENDED", {
      classId: targetClassId,
      sessionId: session._id.toString(),
      status: "Completed",
      actualEnd: session.actualEnd,
      timestamp: new Date().toISOString(),
    });
    console.log(`📢 [LIVE_SERVICE] Ended cho lớp ${targetClassId}`);
  }

  // Bắn thông báo realtime (Session Ended)
  const classInfo = await classModel.findById(targetClassId).lean();
  notificationService
    .notifyLiveSessionEnded({
      session,
      classInfo,
      teacherInfo: session.endedBy,
      io,
    })
    .catch((err) => console.error("❌ Notification Error in notifyLiveSessionEnded:", err));

  // Tự động đồng bộ Điểm danh (Attendance)
  try {
    if (session.participants && session.participants.length > 0) {
      const records = session.participants.map((p) => ({
        studentId: p.studentId,
        status: p.durationSeconds > 60 ? "Present" : "Absent", // Vd: > 1 phút tính là có mặt
        note: `Điểm danh tự động từ Live Session (Tham gia ${Math.round(p.durationSeconds / 60)} phút)`,
      }));

      // Gọi logic điểm danh
      await attendanceService.markAttendance({
        classId: targetClassId,
        date: new Date().toISOString().split("T")[0], // Ngày hiện tại (chỉ lấy YYYY-MM-DD)
        records,
        teacherId: userId,
      });
      console.log(`✅ [LIVE_SERVICE] Đã đồng bộ điểm danh cho ${records.length} học sinh.`);
    }
  } catch (error) {
    console.error("❌ [LIVE_SERVICE] Attendance Sync Error:", error.message);
  }

  return mapLiveSessionResponse(session);
};
