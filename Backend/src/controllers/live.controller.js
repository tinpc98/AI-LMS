import mongoose from "mongoose";
import LiveSession from "../models/liveSession.model.js";
import classModel from "../models/class.model.js";
import { generateLiveSessionRoomName } from "../utils/liveSessionHelper.js";

/**
 * Serializer / Response Mapper chuyển đổi LiveSession document
 * giữ lại alias legacy `meetingRoomId` cho Frontend tương thích ngược.
 */
export const mapLiveSessionResponse = (session) => {
  if (!session) return null;
  const doc = session.toObject ? session.toObject() : session;
  const room = doc.roomName || doc.meetingRoomId || "";
  return {
    ...doc,
    id: doc._id?.toString() || doc.id,
    roomName: room,
    meetingRoomId: room, // Legacy Alias cho Frontend
  };
};

// 1. Giáo viên Tạo / Bắt đầu Buổi học trực tuyến mới
export const createLiveSession = async (req, res) => {
  try {
    const { classId, title, scheduledStart, scheduledEnd } = req.body;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "classId không hợp lệ!" });
    }

    const classInfo = await classModel.findById(classId).select("_id isDeleted");
    if (!classInfo || classInfo.isDeleted) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại hoặc đã bị xóa!" });
    }

    // Kiểm tra xem đã có phiên LiveSession nào đang diễn ra hay chưa
    const existingActiveSession = await LiveSession.findOne({ classId, status: "Live", isDeleted: false });
    if (existingActiveSession) {
      return res.status(409).json({
        success: false,
        message: "Lớp học đã có một buổi học trực tuyến đang diễn ra.",
        data: mapLiveSessionResponse(existingActiveSession),
      });
    }

    // Tính sessionNumber tiếp theo cho Lớp học
    const lastSession = await LiveSession.findOne({ classId }).sort({ sessionNumber: -1 }).select("sessionNumber");
    const nextSessionNumber = lastSession?.sessionNumber ? lastSession.sessionNumber + 1 : 1;

    // PHƯƠNG ÁN A: Khởi tạo ObjectId trước để sinh roomName độc nhất: lms_<classId>_<sessionId>
    const sessionId = new mongoose.Types.ObjectId();
    const roomName = generateLiveSessionRoomName(classId, sessionId);

    const session = await LiveSession.create({
      _id: sessionId,
      classId,
      roomName,
      meetingRoomId: roomName, // Legacy Alias
      sessionNumber: nextSessionNumber,
      title: title?.trim() || `Buổi ${nextSessionNumber}`,
      createdBy: req.user._id || req.user.id,
      scheduledStart: scheduledStart || null,
      scheduledEnd: scheduledEnd || null,
      actualStart: new Date(),
      status: "Live",
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`room_class_${classId}`).emit("LIVE_SESSION_STARTED", {
        classId,
        sessionId: session._id,
        roomName: session.roomName,
        meetingRoomId: session.roomName,
        sessionNumber: session.sessionNumber,
        title: session.title,
        actualStart: session.actualStart,
        status: session.status,
      });
      console.log(`📢 [LIVE_SESSION] Started cho lớp ${classId} với roomName: ${session.roomName}`);
    }

    return res.status(201).json({ success: true, data: mapLiveSessionResponse(session) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lớp học đã có một buổi học trực tuyến đang diễn ra.",
      });
    }
    console.error("[LiveController] createLiveSession Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi server khi tạo buổi học trực tuyến" });
  }
};

// 2. Lấy Buổi học trực tuyến đang diễn ra (Active Session)
export const getActiveLiveSession = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(200).json({ success: true, data: null });
    }

    const activeSession = await LiveSession.findOne({ classId, status: "Live", isDeleted: false });

    return res.status(200).json({ success: true, data: mapLiveSessionResponse(activeSession) });
  } catch (error) {
    console.error("[LiveController] getActiveLiveSession Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi server khi lấy buổi học trực tuyến" });
  }
};

// 3. Giáo viên / Admin Kết thúc Buổi học trực tuyến
export const endLiveSession = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "classId không hợp lệ!" });
    }

    const session = await LiveSession.findOneAndUpdate(
      { classId, status: "Live", isDeleted: false },
      {
        status: "Completed",
        actualEnd: new Date(),
        endedBy: req.user._id || req.user.id,
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Không có buổi học trực tuyến đang diễn ra." });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`room_class_${classId}`).emit("LIVE_SESSION_ENDED", {
        classId,
        sessionId: session._id,
      });
      console.log(`📢 [LIVE_SESSION] Ended cho lớp ${classId}`);
    }

    return res.status(200).json({ success: true, data: mapLiveSessionResponse(session) });
  } catch (error) {
    console.error("[LiveController] endLiveSession Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi server khi kết thúc buổi học trực tuyến" });
  }
};
