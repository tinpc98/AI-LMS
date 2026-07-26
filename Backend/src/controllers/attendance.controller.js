import attendanceService from "../services/attendance.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const markAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return sendError(res, "Vui lòng truyền đầy đủ classId, date và danh sách học sinh cần điểm danh", 400);
    }

    const teacherId = req.user.id;
    const result = await attendanceService.markAttendance({ classId, date, records, teacherId });
    return sendSuccess(res, "Điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi thực hiện điểm danh", 500);
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
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
    const { date } = req.query;
    const result = await attendanceService.getAttendanceByClass(classId, date);
    return sendSuccess(res, "Lấy danh sách điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy danh sách điểm danh", 500);
  }
};

export const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId } = req.query;

    // Phân quyền: Học sinh chỉ được xem điểm danh của chính mình trừ khi là Giáo viên/Admin
    if (req.user.role === "Student" && req.user.id !== studentId) {
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
    const result = await attendanceService.getAttendanceStats(classId);
    return sendSuccess(res, "Lấy thống kê điểm danh thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy thống kê điểm danh", 500);
  }
};
