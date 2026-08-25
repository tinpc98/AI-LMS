import {
  startSessionService,
  getActiveSessionService,
  getSessionDetailService,
  getSessionHistoryService,
  endSessionService,
} from "./live.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// --- API V2 CONTROLLERS & LEGACY ADAPTERS ---

// 1. POST /api/live/sessions (V2) & POST /api/live/create (Legacy)
export const startLiveSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id || req.user._id;
  const io = req.app.get("io");

  const data = await startSessionService({
    sessionId,
    userId,
    io,
  });

  return res.status(201).json({
    success: true,
    message: "Đã bắt đầu buổi học trực tuyến thành công.",
    data,
  });
});

// 2. GET /api/live/classes/:classId/active (V2)
export const getActiveLiveSession = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const data = await getActiveSessionService(classId, false);

  return res.status(200).json({ success: true, data });
});

// 3. GET /api/live/sessions/:sessionId (V2 - Chi tiết phiên học)
export const getLiveSessionDetail = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const data = await getSessionDetailService(sessionId);

  return res.status(200).json({ success: true, data });
});

// 4. GET /api/live/classes/:classId/sessions (V2 - Lịch sử các phiên học của Lớp)
export const getLiveSessionHistory = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { page, limit, status } = req.query;

  const data = await getSessionHistoryService(classId, { page, limit, status });

  return res.status(200).json({ success: true, data });
});

// 5. PATCH /api/live/sessions/:sessionId/end (V2) & POST /api/live/end (Legacy)
export const endLiveSession = asyncHandler(async (req, res) => {
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
});
