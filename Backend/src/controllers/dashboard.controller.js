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

    return sendSuccess(res, "Admin dashboard metrics retrieved successfully", metrics);
  } catch (error) {
    console.error("[DashboardController] getAdminDashboard Error:", error);
    return sendError(res, error.message || "Lỗi nội bộ khi tổng hợp số liệu dashboard", 500);
  }
};
