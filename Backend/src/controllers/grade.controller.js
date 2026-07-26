import gradeService from "../services/grade.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const upsertGrade = async (req, res) => {
  try {
    const { studentId, classId, courseId, category, score, weight, feedback, aiFeedback } = req.body;
    if (!studentId || !classId || !category || score === undefined) {
      return sendError(res, "Vui lòng truyền đầy đủ studentId, classId, category và score", 400);
    }

    const gradedBy = req.user.id;
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
    });

    return sendSuccess(res, "Lưu điểm số thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lưu điểm số", 500);
  }
};

export const getGradesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await gradeService.getGradesByClass(classId);
    return sendSuccess(res, "Lấy bảng điểm của lớp thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy bảng điểm lớp", 500);
  }
};

export const getGradesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId } = req.query;

    if (req.user.role === "Student" && req.user.id !== studentId) {
      return sendError(res, "Bạn không có quyền xem bảng điểm của học sinh khác", 403);
    }

    const result = await gradeService.getGradesByStudent(studentId, classId);
    return sendSuccess(res, "Lấy bảng điểm cá nhân thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy bảng điểm cá nhân", 500);
  }
};

export const getStudentGPA = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const targetStudentId = studentId || req.user.id;

    if (req.user.role === "Student" && req.user.id !== targetStudentId) {
      return sendError(res, "Bạn không có quyền xem điểm tổng kết của học sinh khác", 403);
    }

    const result = await gradeService.calculateStudentGPA(targetStudentId, classId);
    return sendSuccess(res, "Tính điểm tổng kết GPA thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi tính điểm tổng kết", 500);
  }
};
