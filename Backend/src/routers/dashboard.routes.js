import { Router } from "express";
import { getAdminDashboard, getTeacherDashboard, getStudentDashboard } from "../controllers/dashboard.controller.js";
import { verifyUser, isAdmin, isTeacher, isStudent } from "../middlewares/auth.middlewares.js";

const router = Router();

/**
 * GET /api/dashboard/admin
 * @access  Private – Admin only
 * @desc    Trả về số liệu tổng quan hệ thống: tổng người dùng, giáo viên/học sinh
 *          đang hoạt động, lớp học, khóa học và trạng thái sức khỏe hệ thống.
 */
router.get("/admin", verifyUser, isAdmin, getAdminDashboard);

/**
 * GET /api/dashboard/teacher
 * @access  Private – Teacher only
 * @desc    Trả về số liệu tổng quan dành cho giáo viên (tổng lớp học, bài nộp cần chấm, kỳ thi sắp tới)
 */
router.get("/teacher", verifyUser, isTeacher, getTeacherDashboard);

/**
 * GET /api/dashboard/student
 * @access  Private - Student only
 * @desc    Trả về số liệu tổng quan dành cho học sinh (lớp học, bài tập chờ nộp, kỳ thi sắp tới, GPA)
 */
router.get("/student", verifyUser, isStudent, getStudentDashboard);

export default router;
