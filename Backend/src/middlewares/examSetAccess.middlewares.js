import { Types } from "mongoose";
import ExamSet from "../models/examSet.model.js";

const attachExamSetToRequest = async (req, res, next, allowUnauthorizedAs403 = false) => {
  try {
    const examSetId = req.params.examSetId || req.params.id;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    const examSet = await ExamSet.findOne({
      _id: examSetId,
      isDeleted: false,
    });

    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: "Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập",
      });
    }

    const userId = String(req.user.id);
    const userRole = String(req.user.role || "").toLowerCase();
    const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      if (allowUnauthorizedAs403) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền lưu bản nháp cho bộ đề thi này",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập",
      });
    }

    req.examSet = examSet;
    next();
  } catch (error) {
    console.error("[ExamSet Access Middleware] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực quyền truy cập bộ đề thi",
    });
  }
};

/**
 * Middleware kiểm tra quyền chỉnh sửa Exam Set
 * - Owner được phép
 * - Admin được phép theo RBAC hiện tại
 * - User khác trả về 404 để tránh tiết lộ tồn tại resource
 */
export const requireExamSetEditAccess = async (req, res, next) => {
  return attachExamSetToRequest(req, res, next, false);
};

/**
 * Middleware kiểm tra quyền lưu bản nháp Exam Set
 * - Owner được phép
 * - Admin được phép theo RBAC hiện tại
 * - User khác trả về 403
 */
export const requireExamSetDraftAccess = async (req, res, next) => {
  return attachExamSetToRequest(req, res, next, true);
};
