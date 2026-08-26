// File: src/modules/complaint/complaint.controller.js
// Endpoint HTTP cho EduSpace mechanism design Phần C.6 (BR-30/31).
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import {
  submitComplaint,
  respondToComplaint,
  resolveComplaint,
  findOverdueComplaints,
} from "./complaint.service.js";

// reportedBy luôn là chính người đăng nhập — không nhận từ body (chặn giả danh người khiếu nại).
export const createComplaint = asyncHandler(async (req, res) => {
  const reportedBy = req.user.id || req.user._id;
  const { classId, sessionId, aboutTeacherId, category, description } = req.body;

  const complaint = await submitComplaint({
    classId,
    sessionId,
    reportedBy,
    aboutTeacherId,
    category,
    description,
  });

  return res
    .status(201)
    .json({ success: true, message: "Đã ghi nhận khiếu nại.", data: complaint });
});

export const markComplaintResponded = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await respondToComplaint(id);
  return res
    .status(200)
    .json({ success: true, message: "Đã ghi nhận phản hồi đầu tiên.", data: complaint });
});

export const closeComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution } = req.body;
  const resolvedBy = req.user.id || req.user._id;

  const complaint = await resolveComplaint(id, { resolvedBy, resolution });

  return res.status(200).json({ success: true, message: "Đã đóng khiếu nại.", data: complaint });
});

export const listOverdueComplaints = asyncHandler(async (req, res) => {
  const complaints = await findOverdueComplaints();
  return res.status(200).json({ success: true, message: "OK", data: complaints });
});
