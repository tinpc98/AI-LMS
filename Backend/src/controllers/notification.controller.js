import notificationService from "../services/notification.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/notifications/send-bulk
 *
 * Gửi thông báo hàng loạt (bulk) tới người dùng được lọc thông minh.
 *
 * @access  Admin only (verifyUser + isAdmin đã áp dụng tại route)
 *
 * @body {string} targetRole       - "all" | "teacher" | "student"
 * @body {string} enrollmentStatus - "all_active" | "enrolled_only"
 * @body {string} title            - Tiêu đề thông báo (bắt buộc)
 * @body {string} content          - Nội dung thông báo (bắt buộc)
 */
export const sendBulkNotification = async (req, res) => {
  try {
    const { targetRole, enrollmentStatus, title, content } = req.body;
    const senderId = req.user?.id || req.user?._id;

    const result = await notificationService.sendBulkNotifications({
      targetRole,
      enrollmentStatus,
      title,
      content,
      senderId,
    });

    // Nếu không tìm thấy người nhận nào → vẫn trả 200 nhưng thông báo rõ
    if (result.notificationsSent === 0) {
      return sendSuccess(
        res,
        result.message || "Không có thông báo nào được gửi.",
        { recipientCount: 0, notificationsSent: 0 }
      );
    }

    return sendSuccess(
      res,
      `Gửi thông báo thành công tới ${result.notificationsSent} người dùng.`,
      {
        recipientCount: result.recipientCount,
        notificationsSent: result.notificationsSent,
      },
      null,
      201
    );
  } catch (error) {
    console.error("[NotificationController] sendBulkNotification Error:", error);

    // Lỗi validation từ service → 400 Bad Request
    // Lỗi hệ thống (DB, ...) → 500
    const isValidationError =
      error.message?.includes("bắt buộc") ||
      error.message?.includes("không hợp lệ") ||
      error.message?.includes("không được để trống");

    return sendError(
      res,
      error.message || "Lỗi khi gửi thông báo hàng loạt",
      isValidationError ? 400 : 500
    );
  }
};
