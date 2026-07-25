import crypto from "crypto";
import LiveSession from "../models/liveSession.model.js";
import classModel from "../models/class.model.js";

export const createLiveSession = async (req, res) => {
  try {
    const { classId, title, scheduledStart, scheduledEnd } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: "classId is required" });
    }

    const classInfo = await classModel.findById(classId).select("meetingRoomId");
    if (!classInfo) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    if (!classInfo.meetingRoomId) {
      classInfo.meetingRoomId = `room_${crypto.randomBytes(4).toString("hex")}`;
      await classInfo.save();
    }

    let session = await LiveSession.findOne({ classId, status: "Live" });

    if (!session) {
      const lastSession = await LiveSession.findOne({ classId }).sort({ sessionNumber: -1 }).select("sessionNumber");
      const nextSessionNumber = lastSession?.sessionNumber ? lastSession.sessionNumber + 1 : 1;

      session = await LiveSession.create({
        classId,
        meetingRoomId: classInfo.meetingRoomId,
        sessionNumber: nextSessionNumber,
        title: title?.trim() || `Buổi ${nextSessionNumber}`,
        createdBy: req.user._id || req.user.id,
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
        actualStart: new Date(),
        status: "Live",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`room_class_${classId}`).emit("LIVE_SESSION_STARTED", {
        classId,
        meetingRoomId: session.meetingRoomId,
        sessionNumber: session.sessionNumber,
        title: session.title,
        actualStart: session.actualStart,
        status: session.status,
      });
      console.log(`📢 Realtime Broadcast: LIVE_SESSION_STARTED cho lớp ${classId}`);
    }

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveLiveSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const activeSession = await LiveSession.findOne({ classId, status: "Live" });

    return res.status(200).json({ success: true, data: activeSession });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const endLiveSession = async (req, res) => {
  try {
    const { classId } = req.body;

    const session = await LiveSession.findOneAndUpdate(
      { classId, status: "Live" },
      { status: "Completed", actualEnd: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Không có buổi học trực tuyến đang diễn ra." });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`room_class_${classId}`).emit("LIVE_SESSION_ENDED", {
        classId,
      });
      console.log(`📢 Realtime Broadcast: LIVE_SESSION_ENDED cho lớp ${classId}`);
    }

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

