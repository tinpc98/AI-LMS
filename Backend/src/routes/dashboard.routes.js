import { Router } from "express";
import { getAdminDashboard } from "../controllers/dashboard.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

/**
 * GET /api/dashboard/admin
 * @access  Private – Admin only
 * @desc    Trả về số liệu tổng quan hệ thống: tổng người dùng, giáo viên/học sinh
 *          đang hoạt động, lớp học, khóa học và trạng thái sức khỏe hệ thống.
 */
router.get("/admin", verifyUser, isAdmin, getAdminDashboard);

export default router;
