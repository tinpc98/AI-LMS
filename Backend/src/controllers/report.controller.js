import mongoose from "mongoose";
import {
  buildGradesExcel,
  buildAttendanceExcel,
  sanitizeFilename,
} from "../services/report.service.js";
import { sendError } from "#shared/utils/response.js";

// ─────────────────────────────────────────────
// HELPER – Validate classId và ghi headers file
// ─────────────────────────────────────────────

/**
 * Kiểm tra classId truyền vào có phải ObjectId hợp lệ không.
 * Trả về true nếu hợp lệ, ngược lại gửi response 400 và trả về false.
 */
const validateClassId = (id, res) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    sendError(res, "ID lớp học không hợp lệ!", 400);
    return false;
  }
  return true;
};

/**
 * Ghi HTTP headers và gửi buffer Excel về client dưới dạng file download.
 * @param {import("express").Response} res
 * @param {Buffer} buffer - Nội dung file Excel
 * @param {string} filename - Tên file (không kèm .xlsx)
 */
const sendExcelFile = (res, buffer, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.end(buffer);
};

// ─────────────────────────────────────────────
// CONTROLLER: Export Bảng Điểm
// ─────────────────────────────────────────────

/**
 * GET /api/reports/export/grades/:classId
 *
 * Xuất file Excel bảng điểm của lớp học.
 * Mỗi hàng gồm: STT, Họ tên, Email, Chuyên cần, Bài tập, Giữa kỳ, Cuối kỳ, Khác, GPA.
 *
 * @access  Admin | Teacher được phân công cho lớp
 */
export const exportGrades = async (req, res) => {
  const { classId } = req.params;

  if (!validateClassId(classId, res)) return;

  try {
    const { buffer, className } = await buildGradesExcel(classId);
    const safeClassName = sanitizeFilename(className);
    sendExcelFile(res, buffer, `Class_${safeClassName}_Grades`);
  } catch (error) {
    console.error("[ReportController] exportGrades Error:", error);

    // Nếu lớp không tồn tại thì trả 404, ngược lại 500
    const statusCode = error.message?.includes("không tồn tại") ? 404 : 500;
    return sendError(res, error.message || "Lỗi khi xuất bảng điểm", statusCode);
  }
};

// ─────────────────────────────────────────────
// CONTROLLER: Export Bảng Điểm Danh
// ─────────────────────────────────────────────

/**
 * GET /api/reports/export/attendance/:classId
 *
 * Xuất file Excel tổng hợp điểm danh của lớp học.
 * Mỗi hàng gồm: STT, Họ tên, Email, Tổng buổi, Có mặt, Vắng, Trễ, Nghỉ phép, Tỉ lệ (%).
 *
 * @access  Admin | Teacher được phân công cho lớp
 */
export const exportAttendance = async (req, res) => {
  const { classId } = req.params;

  if (!validateClassId(classId, res)) return;

  try {
    const { buffer, className } = await buildAttendanceExcel(classId);
    const safeClassName = sanitizeFilename(className);
    sendExcelFile(res, buffer, `Class_${safeClassName}_Attendance`);
  } catch (error) {
    console.error("[ReportController] exportAttendance Error:", error);

    const statusCode = error.message?.includes("không tồn tại") ? 404 : 500;
    return sendError(res, error.message || "Lỗi khi xuất bảng điểm danh", statusCode);
  }
};
