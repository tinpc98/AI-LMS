import dashboardService from "../services/dashboard.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/dashboard/admin
 * Trả về số liệu tổng quan hệ thống dành cho Admin Dashboard.
 * Controller giữ vai trò mỏng (thin controller): nhận request,
 * ủy quyền toàn bộ logic cho Service, trả về response chuẩn.
 *
 * @requires verifyUser  – Phải đăng nhập
 * @requires isAdmin     – Phải là Admin
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const metrics = await dashboardService.getAdminMetrics();

    return sendSuccess(
      res,
      "Admin dashboard metrics retrieved successfully",
      metrics
    );
  } catch (error) {
    console.error("[DashboardController] getAdminDashboard Error:", error);
    return sendError(
      res,
      error.message || "Lỗi nội bộ khi tổng hợp số liệu dashboard",
      500
    );
  }
};

/**
 * GET /api/dashboard/teacher
 * Trả về số liệu tổng quan dành cho giáo viên (Teacher Dashboard).
 */
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user._id;
    const metrics = await dashboardService.getTeacherMetrics(teacherId);

    return sendSuccess(
      res,
      "Teacher dashboard metrics retrieved successfully",
      metrics
    );
  } catch (error) {
    console.error("[DashboardController] getTeacherDashboard Error:", error);
    return sendError(
      res,
      error.message || "Lỗi nội bộ khi tổng hợp số liệu dashboard giáo viên",
      500
    );
  }
};

/**
 * GET /api/dashboard/student
 * Trả về số liệu tổng quan dành cho học sinh (Student Dashboard).
 */
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const metrics = await dashboardService.getStudentMetrics(studentId);

    return sendSuccess(
      res,
      "Student dashboard metrics retrieved successfully",
      metrics
    );
  } catch (error) {
    console.error("[DashboardController] getStudentDashboard Error:", error);
    return sendError(
      res,
      error.message || "Lỗi nội bộ khi tổng hợp số liệu dashboard học sinh",
      500
    );
  }
};
