import mongoose from "mongoose";
import { Exam } from "#modules/exam";
import { ExamAttempt } from "#modules/exam-attempt";
import { checkClassTeacherOwnership } from "#modules/class";

/**
 * Service kiểm tra quyền truy cập Socket Room Phòng Thi.
 * Theo cùng convention với checkSocketLiveClassAccess (socketLiveAccess.service.js):
 * không bao giờ tin danh tính client tự khai — `user` phải là socket.user đã được
 * xác thực qua socketAuthMiddleware (JWT handshake).
 */
export const checkSocketExamAccess = async (user, { examId, attemptId }) => {
  if (!user || !user.id || !user.role) {
    return {
      allowed: false,
      code: "SOCKET_AUTH_MISSING_TOKEN",
      message: "Danh tính người dùng chưa được xác thực.",
    };
  }

  if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
    return {
      allowed: false,
      code: "SOCKET_INVALID_EXAM_ID",
      message: "Mã đề thi (examId) không đúng định dạng.",
    };
  }

  const exam = await Exam.findOne({ _id: examId, isDeleted: false }).select("_id classId").lean();
  if (!exam) {
    return {
      allowed: false,
      code: "SOCKET_EXAM_NOT_FOUND",
      message: "Đề thi không tồn tại hoặc đã bị xóa.",
    };
  }

  if (user.role === "admin") {
    return { allowed: true, exam, accessType: "admin" };
  }

  if (user.role === "teacher") {
    const isOwner = await checkClassTeacherOwnership(exam.classId, user.id, user.role);
    if (!isOwner) {
      return {
        allowed: false,
        code: "SOCKET_EXAM_ACCESS_DENIED",
        message: "Bạn không phải là Giáo viên phụ trách lớp học của đề thi này.",
      };
    }
    return { allowed: true, exam, accessType: "teacher-owner" };
  }

  if (user.role === "student") {
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return {
        allowed: false,
        code: "SOCKET_INVALID_ATTEMPT_ID",
        message: "Mã lượt thi (attemptId) không đúng định dạng.",
      };
    }

    const attempt = await ExamAttempt.findOne({ _id: attemptId, isDeleted: false })
      .select("_id studentId examId")
      .lean();

    if (
      !attempt ||
      attempt.examId.toString() !== examId ||
      attempt.studentId.toString() !== user.id
    ) {
      return {
        allowed: false,
        code: "SOCKET_EXAM_ACCESS_DENIED",
        message: "Bạn không có quyền tham gia phòng thi này.",
      };
    }

    return { allowed: true, exam, attempt, accessType: "student-owner" };
  }

  return {
    allowed: false,
    code: "SOCKET_EXAM_ACCESS_DENIED",
    message: "Vai trò người dùng không hợp lệ.",
  };
};

export default checkSocketExamAccess;
