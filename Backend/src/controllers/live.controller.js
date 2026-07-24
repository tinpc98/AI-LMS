import LiveSession from "../models/liveSession.model.js";

// 1. Giáo viên khởi tạo buổi học online (Đảm bảo duy nhất 1 roomName trong suốt buổi học)
export const createLiveSession = async (req, res) => {
  try {
    const { classId, title } = req.body;

    // Kiểm tra nếu đã có buổi học đang diễn ra cho lớp này -> Tái sử dụng session cũ, KHÔNG tạo roomName mới
    let session = await LiveSession.findOne({ classId, isLive: true });

    if (!session) {
      // Chỉ khi chưa có phòng nào đang mở mới tạo phòng mới với roomName duy nhất
      const roomName = `AI-LMS-${classId}-${Date.now()}`;
      session = await LiveSession.create({
        classId,
        title: title || "Buổi học trực tuyến",
        roomName,
        createdBy: req.user._id || req.user.id,
        isLive: true,
      });
    }

    // Broadcast Realtime Event tới phòng học qua Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`room_class_${classId}`).emit("LIVE_SESSION_STARTED", {
        classId,
        roomName: session.roomName,
        title: session.title,
        startedAt: session.startedAt,
      });
      console.log(`📢 Realtime Broadcast: LIVE_SESSION_STARTED cho lớp ${classId} (roomName: ${session.roomName})`);
    }

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy phòng học đang diễn ra trong lớp
export const getActiveLiveSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const activeSession = await LiveSession.findOne({ classId, isLive: true });

    return res.status(200).json({ success: true, data: activeSession });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Giáo viên kết thúc buổi học online
export const endLiveSession = async (req, res) => {
  try {
    const { classId } = req.body;

    const session = await LiveSession.findOneAndUpdate(
      { classId, isLive: true },
      { isLive: false, endedAt: new Date() },
      { new: true }
    );

    // Broadcast Realtime Event báo phòng đã kết thúc
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

