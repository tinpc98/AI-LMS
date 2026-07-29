import Class from "../models/class.model.js";
import { AIError, AIErrorCode } from "./aiError.js";

/**
 * Kiểm tra xem người dùng có quyền quản lý lớp học hay không
 * Admins luôn có quyền.
 * Teacher chỉ có quyền nếu class.teacherId trùng với userId.
 * Trả về true/false hoặc ném AIError.
 */
export const verifyClassTeacherAccess = async (classId, userId, role, throwError = true) => {
  if (role === "admin") return true;

  if (role !== "teacher") {
    if (throwError) throw new AIError("Chỉ có Giáo viên hoặc Admin mới có quyền thực hiện hành động này", AIErrorCode.AI_FEATURE_DISABLED, 403);
    return false;
  }

  const classData = await Class.findOne({ _id: classId, isDeleted: false });
  
  // Trả về 404 để chống enumeration
  if (!classData) {
    if (throwError) throw new AIError("Không tìm thấy lớp học hoặc bạn không có quyền truy cập", AIErrorCode.AI_FEATURE_DISABLED, 404);
    return false;
  }

  if (classData.teacherId?.toString() !== userId.toString()) {
    if (throwError) throw new AIError("Không tìm thấy lớp học hoặc bạn không có quyền truy cập", AIErrorCode.AI_FEATURE_DISABLED, 404); // Lại 404 chống enum
    return false;
  }

  return true;
};
