import mongoose from "mongoose";
import attendanceService from "../services/attendance.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { checkClassTeacherOwnership } from "../middlewares/auth.middleware.js";

export const markAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return sendError(res, "Vui lòng truyền đầy đủ classId, date và danh sách học sinh cần điểm danh", 400);
    }

    const teacherId = req.user.id || req.user._id;
    const isAuthorized = await checkClassTeacherOwnership(classId, teacherId, req.user?.role);
    if (!isAuthorized) {
      return sendError(res, "Bạn không có quyền điểm danh cho lớp học này!", 403);
    }

    const result = await attendanceService.markAttendance({ classId, date, records, teacherId });
    return sendSuccess(res, "Điểm danh thành công", result);
  } catch (error) {
    if (error.code === 11000 || error.name === "MongoServerError") {
      return sendError(res, "Học sinh đã được điểm danh trong ngày này.", 409);
    }
    return sendError(res, error.message || "Lỗi khi thực hiện điểm danh", error.status || 500);
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "ID bản ghi điểm danh không hợp lệ!", 400);
    }

    const { status, note } = req.body;
    const result = await attendanceService.updateAttendance(id, { status, note });
    return sendSuccess(res, "Cập nhật điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi cập nhật điểm danh", 500);
  }
};

export const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const { date } = req.query;
    const result = await attendanceService.getAttendanceByClass(classId, date);
    return sendSuccess(res, "Lấy danh sách điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy danh sách điểm danh", 500);
  }
};

export const getClassSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const result = await attendanceService.getClassSessions(classId);
    return sendSuccess(res, "Lấy danh sách buổi học thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy danh sách buổi học", 500);
  }
};

export const getAttendanceMatrix = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const result = await attendanceService.getAttendanceMatrix(classId);
    return sendSuccess(res, "Lấy ma trận điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy ma trận điểm danh", 500);
  }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
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

    // Phân quyền: Học sinh chỉ được xem điểm danh của chính mình
    if (userRole === "student" && loggedUserId !== studentId.toString()) {
      return sendError(res, "Bạn không có quyền xem điểm danh của học sinh khác", 403);
    }

    const result = await attendanceService.getAttendanceByStudent(studentId, classId);
    return sendSuccess(res, "Lấy lịch sử điểm danh học sinh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy lịch sử điểm danh", 500);
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const result = await attendanceService.getAttendanceStats(classId);
    return sendSuccess(res, "Lấy thống kê điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy thống kê điểm danh", 500);
  }
};
