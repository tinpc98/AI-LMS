import ClassModel from "./class.model.js";
import { AuthorizationError, NotFoundError, ValidationError } from "#shared/utils/appError.js";

import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";

/**
 * Middleware kiểm tra quyền truy cập vào một lớp học.
 * Hỗ trợ lấy classId từ:
 * - req.params.classId
 * - req.body.classId
 */
export const checkClassAccess = async (req, res, next) => {
  try {
    let classId = req.params?.classId || req.body?.classId;

    if (!classId) {
      return next(new ValidationError("Thiếu thông tin classId"));
    }

    const targetClass = await ClassModel.findById(classId).select("teacherId students").lean();
    if (!targetClass) {
      return next(new NotFoundError("Không tìm thấy lớp học"));
    }

    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    // Admin có toàn quyền
    if (role === "admin") {
      req.classDetail = targetClass;
      return next();
    }

    // Teacher phải là người tạo / phụ trách lớp
    if (role === "teacher") {
      if (targetClass.teacherId?.toString() !== userId) {
        return next(new AuthorizationError("Bạn không có quyền truy cập lớp học này"));
      }
      req.classDetail = targetClass;
      return next();
    }

    // Student phải thuộc lớp và có status ACTIVE (thay thế status Enrolled cũ)
    if (role === "student") {
      const isEnrolled = await ClassEnrollment.exists({
        classId,
        studentId: userId,
        status: "ACTIVE"
      });
      if (!isEnrolled) {
        return next(new AuthorizationError("Bạn không có quyền truy cập lớp học này"));
      }
      req.classDetail = targetClass;
      return next();
    }

    return next(new AuthorizationError("Bạn không có quyền truy cập lớp học này"));
  } catch (error) {
    return next(error);
  }
};
