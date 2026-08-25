import mongoose from "mongoose";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import { getTeacherContributionSummary } from "./contribution.service.js";

const parseRange = (query) => ({
  from: query.from ? new Date(query.from) : undefined,
  to: query.to ? new Date(query.to) : undefined,
});

// Giáo viên xem đóng góp của chính mình.
export const getMyContributionSummary = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user._id;
    const summary = await getTeacherContributionSummary(teacherId, parseRange(req.query));
    return sendSuccess(res, "Lấy tổng hợp đóng góp thành công", summary);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy tổng hợp đóng góp", 500);
  }
};

// Admin xem đóng góp của một giáo viên bất kỳ.
export const getTeacherContributionSummaryAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return sendError(res, "ID giáo viên không hợp lệ!", 400);
    }
    const summary = await getTeacherContributionSummary(teacherId, parseRange(req.query));
    return sendSuccess(res, "Lấy tổng hợp đóng góp thành công", summary);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy tổng hợp đóng góp", 500);
  }
};
