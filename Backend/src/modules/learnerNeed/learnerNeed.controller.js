import * as learnerNeedService from "./learnerNeed.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

export const createMyLearnerNeed = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  const need = await learnerNeedService.createLearnerNeed(studentId, req.body);
  res.status(201).json({
    success: true,
    message: "Đã ghi nhận nhu cầu học tập của bạn",
    data: need,
  });
});

export const getMyLearnerNeeds = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  const needs = await learnerNeedService.getMyLearnerNeeds(studentId);
  res
    .status(200)
    .json({ success: true, message: "Danh sách nhu cầu học tập của bạn", data: needs });
});

// Admin/giáo viên xem để xếp lớp thủ công — MVP chưa có matching tự động (xem gap analysis
// R04), đây là nơi con người đọc nhu cầu thật để quyết định.
export const listLearnerNeeds = asyncHandler(async (req, res) => {
  const { subject, status } = req.query;
  const needs = await learnerNeedService.listLearnerNeeds({ subject, status });
  res.status(200).json({ success: true, message: "Danh sách nhu cầu học tập", data: needs });
});

export const cancelMyLearnerNeed = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  const need = await learnerNeedService.cancelMyLearnerNeed(studentId, req.params.id);
  res.status(200).json({ success: true, message: "Đã huỷ nhu cầu học tập", data: need });
});

export const updateLearnerNeedStatus = asyncHandler(async (req, res) => {
  const need = await learnerNeedService.updateLearnerNeedStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: "Đã cập nhật trạng thái", data: need });
});
