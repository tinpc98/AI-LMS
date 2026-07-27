import { Router } from "express";
import { sendBulkNotification } from "../controllers/notification.controller.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

/**
 * POST /api/notifications/send-bulk
 *
 * @desc  Gửi thông báo hàng loạt đến người dùng được lọc thông minh.
 *        Hỗ trợ lọc theo role (all / teacher / student) và
 *        trạng thái đăng ký lớp học (all_active / enrolled_only).
 *
 * @access Admin only
 *
 * @body {string} targetRole       - "all" | "teacher" | "student"
 * @body {string} enrollmentStatus - "all_active" | "enrolled_only"
 * @body {string} title            - Tiêu đề thông báo (required)
 * @body {string} content          - Nội dung thông báo (required)
 *
 * @example
 *   POST /api/notifications/send-bulk
 *   Authorization: Bearer <admin_token>
 *   {
 *     "targetRole": "student",
 *     "enrollmentStatus": "enrolled_only",
 *     "title": "Thông báo quan trọng",
 *     "content": "Kỳ thi giữa kỳ sẽ diễn ra vào ngày 15/08/2026."
 *   }
 */
router.post(
  "/send-bulk",
  verifyUser,
  isAdmin,
  sendBulkNotification
);

export default router;
