// File: src/modules/feedback/cohortFeedback.controller.js
// Endpoint HTTP cho EduSpace mechanism design Phần C.3.
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { ValidationError } from "#shared/utils/appError.js";
import {
  submitFeedback,
  getTeacherAverageRatings,
  getFeedbackDetailsForAdmin,
} from "./cohortFeedback.service.js";

// Học viên nộp đánh giá cho CHÍNH mình — studentId luôn lấy từ req.user, không nhận từ body
// (cùng nguyên tắc với vouchForTeacher: không cho giả danh người đánh giá).
export const submitClassFeedback = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const studentId = req.user.id || req.user._id;
  const { ratingClarity, ratingHelpfulness, comment } = req.body;

  if (ratingClarity === undefined || ratingHelpfulness === undefined) {
    throw new ValidationError("ratingClarity và ratingHelpfulness là bắt buộc.");
  }

  const feedback = await submitFeedback(classId, studentId, {
    ratingClarity,
    ratingHelpfulness,
    comment,
  });

  return res.status(201).json({ success: true, message: "Đã ghi nhận đánh giá.", data: feedback });
});

// Giáo viên chỉ xem được điểm trung bình của CHÍNH MÌNH — ẩn danh (service không trả studentId).
export const getMyAverageRatings = asyncHandler(async (req, res) => {
  const teacherId = req.user.id || req.user._id;
  const result = await getTeacherAverageRatings(teacherId);
  return res.status(200).json({ success: true, message: "OK", data: result });
});

// Admin xem chi tiết (kèm studentId) của MỘT giáo viên bất kỳ — phục vụ khiếu nại/theo dõi.
export const getTeacherFeedbackDetails = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const result = await getFeedbackDetailsForAdmin(teacherId);
  return res.status(200).json({ success: true, message: "OK", data: result });
});
