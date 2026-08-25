import mongoose from "mongoose";
import gradeService from "./grade.service.js";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import { checkClassTeacherOwnership } from "#modules/class/index.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

export const upsertGrade = asyncHandler(async (req, res) => {
  const { studentId, classId, courseId, category, score, weight, feedback, aiFeedback } =
    req.body;
  if (!studentId || !classId || !category || score === undefined) {
    return sendError(res, "Vui lòng truyền đầy đủ studentId, classId, category và score", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(classId)) {
    return sendError(res, "ID học sinh hoặc ID lớp học không hợp lệ", 400);
  }

  const gradedBy = req.user.id || req.user._id;
  const gradedByRole = req.user.role;
  const result = await gradeService.upsertGrade({
    studentId,
    classId,
    courseId,
    category,
    score,
    weight,
    feedback,
    aiFeedback,
    gradedBy,
    gradedByRole,
  });

  return sendSuccess(res, "Lưu điểm số thành công", result);
});

export const getGradesByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return sendError(res, "ID lớp học không hợp lệ!", 400);
  }

  const userId = (req.user.id || req.user._id || "").toString();
  const userRole = req.user.role;
  const result = await gradeService.getGradesByClass(classId, userId, userRole);
  return sendSuccess(res, "Lấy bảng điểm của lớp thành công", result);
});

export const getGradesByStudent = asyncHandler(async (req, res) => {
  let { studentId } = req.params;
  const { classId } = req.query;

  const loggedUserId = (req.user?.id || req.user?._id || "").toString();
  const userRole = (req.user?.role || "").toLowerCase();

  // Hỗ trợ alias "me" hoặc "my" hoặc nếu không truyền studentId
  if (!studentId || studentId === "me" || studentId === "my") {
    studentId = loggedUserId;
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return sendError(res, "ID học sinh không hợp lệ!", 400);
  }

  if (userRole === "student" && loggedUserId !== studentId.toString()) {
    return sendError(res, "Bạn không có quyền xem bảng điểm của học sinh khác", 403);
  }

  if (userRole === "teacher") {
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "Giáo viên phải cung cấp classId để xem bảng điểm học sinh", 400);
    }
    const isAuthorized = await checkClassTeacherOwnership(classId, loggedUserId, userRole);
    if (!isAuthorized) {
      return sendError(res, "Bạn không có quyền xem bảng điểm của học sinh ở lớp này", 403);
    }
  }

  const result = await gradeService.getGradesByStudent(studentId, classId);
  return sendSuccess(res, "Lấy bảng điểm cá nhân thành công", result);
});

export const getStudentGPA = asyncHandler(async (req, res) => {
  const { classId, studentId: paramStudentId } = req.params;
  const loggedUserId = (req.user?.id || req.user?._id || "").toString();
  const userRole = (req.user?.role || "").toLowerCase();

  let targetStudentId = paramStudentId;
  if (!targetStudentId || targetStudentId === "me" || targetStudentId === "my") {
    targetStudentId = loggedUserId;
  }

  if (
    !classId ||
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(targetStudentId)
  ) {
    return sendError(res, "ID lớp học hoặc ID học sinh không hợp lệ!", 400);
  }

  if (userRole === "student" && loggedUserId !== targetStudentId.toString()) {
    return sendError(res, "Bạn không có quyền xem điểm tổng kết của học sinh khác", 403);
  }

  if (userRole === "teacher") {
    const isAuthorized = await checkClassTeacherOwnership(classId, loggedUserId, userRole);
    if (!isAuthorized) {
      return sendError(res, "Bạn không có quyền xem điểm tổng kết của học sinh ở lớp này", 403);
    }
  }

  const result = await gradeService.calculateStudentGPA(targetStudentId, classId);
  return sendSuccess(res, "Tính điểm tổng kết GPA thành công", result);
});
