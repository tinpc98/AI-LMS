import mongoose from "mongoose";
import { Class } from "#modules/class";

/**
 * Service kiểm tra quyền truy cập Socket Room Lớp Học Trực Tuyến
 */
export const checkSocketLiveClassAccess = async (user, classId) => {
  if (!user || !user.id || !user.role) {
    return {
      allowed: false,
      code: "SOCKET_AUTH_MISSING_TOKEN",
      message: "Danh tính người dùng chưa được xác thực.",
    };
  }

  // 1. QUYẾT ĐỊNH PHÂN QUYỀN: Admin bị chặn hoàn toàn khỏi Live Room
  if (user.role === "admin") {
    return {
      allowed: false,
      code: "SOCKET_ADMIN_NOT_ALLOWED",
      message: "Quản trị viên không được phép tham gia socket room của phòng học trực tuyến.",
    };
  }

  // 2. Validate classId ObjectId
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return {
      allowed: false,
      code: "SOCKET_INVALID_CLASS_ID",
      message: "Mã định danh Lớp học (classId) không đúng định dạng.",
    };
  }

  // 3. Tra cứu Class chưa bị Soft Delete
  const targetClass = await Class.findOne({ _id: classId, isDeleted: false })
    .select("_id teacherId students className")
    .lean();

  if (!targetClass) {
    return {
      allowed: false,
      code: "SOCKET_CLASS_NOT_FOUND",
      message: "Lớp học không tồn tại hoặc đã bị xóa.",
    };
  }

  // 4. Kiểm tra Teacher Ownership
  if (user.role === "teacher") {
    const isOwner = targetClass.teacherId && targetClass.teacherId.toString() === user.id;
    if (!isOwner) {
      return {
        allowed: false,
        code: "SOCKET_CLASS_ACCESS_DENIED",
        message: "Bạn không phải là Giáo viên chủ trì của Lớp học này.",
      };
    }
    return { allowed: true, targetClass, accessType: "teacher-owner" };
  }

  // 5. Kiểm tra Student Enrollment
  if (user.role === "student") {
    const isEnrolled =
      Array.isArray(targetClass.students) &&
      targetClass.students.some(
        (s) => s.studentId && s.studentId.toString() === user.id && s.status === "Enrolled"
      );

    if (!isEnrolled) {
      return {
        allowed: false,
        code: "SOCKET_CLASS_ACCESS_DENIED",
        message: "Bạn chưa đăng ký môn học này hoặc chưa hoàn tất ghi danh.",
      };
    }
    return { allowed: true, targetClass, accessType: "student-enrolled" };
  }

  return {
    allowed: false,
    code: "SOCKET_CLASS_ACCESS_DENIED",
    message: "Vai trò người dùng không hợp lệ.",
  };
};

export default checkSocketLiveClassAccess;
