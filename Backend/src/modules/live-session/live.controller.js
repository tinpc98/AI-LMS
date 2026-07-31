import {
  createSessionService,
  getActiveSessionService,
  getSessionDetailService,
  getSessionHistoryService,
  endSessionService,
} from "./live.service.js";
import { LiveError, sendLiveError } from "./live.validator.js";

// --- API V2 CONTROLLERS & LEGACY ADAPTERS ---

// 1. POST /api/live/sessions (V2) & POST /api/live/create (Legacy)
export const createLiveSession = async (req, res) => {
  try {
    const { classId, title, scheduledStart, scheduledEnd } = req.body;
    const userId = req.user.id || req.user._id;
    const io = req.app.get("io");

    const data = await createSessionService({
      classId,
      title,
      scheduledStart,
      scheduledEnd,
      userId,
      io,
    });

    return res.status(201).json({
      success: true,
      message: "Đã bắt đầu buổi học trực tuyến thành công.",
      data,
    });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[LiveController] createLiveSession Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi tạo buổi học" });
  }
};

// 2. GET /api/live/classes/:classId/active (V2)
export const getActiveLiveSession = async (req, res) => {
  try {
    const { classId } = req.params;

    const data = await getActiveSessionService(classId, false);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[LiveController] getActiveLiveSession Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi lấy buổi học đang diễn ra",
    });
  }
};

// 3. GET /api/live/sessions/:sessionId (V2 - Chi tiết phiên học)
export const getLiveSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const data = await getSessionDetailService(sessionId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[LiveController] getLiveSessionDetail Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi lấy chi tiết buổi học" });
  }
};

// 4. GET /api/live/classes/:classId/sessions (V2 - Lịch sử các phiên học của Lớp)
export const getLiveSessionHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const { page, limit, status } = req.query;

    const data = await getSessionHistoryService(classId, { page, limit, status });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[LiveController] getLiveSessionHistory Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi lấy lịch sử buổi học" });
  }
};

// 5. PATCH /api/live/sessions/:sessionId/end (V2) & POST /api/live/end (Legacy)
export const endLiveSession = async (req, res) => {
  try {
    const sessionId = req.params?.sessionId;
    const classId = req.body?.classId;
    const userId = req.user.id || req.user._id;
    const io = req.app.get("io");

    const data = await endSessionService({
      sessionId,
      classId,
      userId,
      io,
    });

    return res.status(200).json({
      success: true,
      message: "Đã kết thúc buổi học trực tuyến.",
      data,
    });
  } catch (error) {
    if (error instanceof LiveError) {
      return sendLiveError(res, error.statusCode, error.code, error.message, error.details);
    }
    console.error("[LiveController] endLiveSession Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server khi kết thúc buổi học" });
  }
};
