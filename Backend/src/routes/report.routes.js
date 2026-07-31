import { Router } from "express";
import { exportGrades, exportAttendance } from "../controllers/report.controller.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middleware.js";
import classModel from "../models/class.model.js";
import mongoose from "mongoose";

const router = Router();

// ─────────────────────────────────────────────
// MIDDLEWARE: isAdminOrAssignedTeacher
// ─────────────────────────────────────────────

/**
 * Middleware kiểm tra quyền truy cập báo cáo của lớp học.
 *
 * Cho phép truy cập nếu người dùng là:
 *  - Admin (toàn quyền), HOẶC
 *  - Teacher được phân công (teacherId của lớp === userId hiện tại)
 *
 * Nếu không thoả mãn → 403 Forbidden.
 */
const isAdminOrAssignedTeacher = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();
    const userId = (req.user?.id || req.user?._id || "").toString();

    // Admin có quyền truy cập không giới hạn
    if (userRole === "admin") {
      return next();
    }

    // Teacher: chỉ được xem lớp mình phụ trách
    if (userRole === "teacher") {
      const { classId } = req.params;

      // Bảo vệ thêm: validate classId tại đây để trả lỗi sớm
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
      }

      const targetClass = await classModel.findById(classId).lean();
      if (!targetClass) {
        return res.status(404).json({ success: false, message: "Lớp học không tồn tại!" });
      }

      const isAssigned = targetClass.teacherId && targetClass.teacherId.toString() === userId;

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem báo cáo của lớp học này!",
        });
      }

      return next();
    }

    // Các role còn lại (Student, ...) → từ chối
    return res.status(403).json({
      success: false,
      message:
        "Quyền truy cập bị từ chối. Chỉ Admin hoặc Giáo viên được phân công mới được xuất báo cáo!",
    });
  } catch (error) {
    console.error("[ReportRouter] isAdminOrAssignedTeacher Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi phân quyền nội bộ." });
  }
};

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

/**
 * GET /api/reports/export/grades/:classId
 * @desc  Xuất bảng điểm lớp học ra file Excel (.xlsx)
 * @query ?format=excel  (mặc định – chỉ hỗ trợ excel hiện tại)
 * @access Admin | Teacher được phân công
 */
router.get("/export/grades/:classId", verifyUser, isAdminOrAssignedTeacher, exportGrades);

/**
 * GET /api/reports/export/attendance/:classId
 * @desc  Xuất bảng điểm danh tổng hợp lớp học ra file Excel (.xlsx)
 * @query ?format=excel  (mặc định – chỉ hỗ trợ excel hiện tại)
 * @access Admin | Teacher được phân công
 */
router.get("/export/attendance/:classId", verifyUser, isAdminOrAssignedTeacher, exportAttendance);

export default router;
