import notificationService from "./notification.service.js";
import { sendSuccess } from "#shared/utils/response.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { ValidationError } from "#shared/utils/appError.js";

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
export const sendBulkNotification = asyncHandler(async (req, res) => {
  const { targetRole, enrollmentStatus, title, content } = req.body;
  const senderId = req.user?.id || req.user?._id;

  try {
    const result = await notificationService.sendBulkNotifications({
      targetRole,
      enrollmentStatus,
      title,
      content,
      senderId,
    });

    if (result.notificationsSent === 0) {
      return sendSuccess(res, result.message || "Không có thông báo nào được gửi.", {
        recipientCount: 0,
        notificationsSent: 0,
      });
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
    const isValidationError =
      error.message?.includes("bắt buộc") ||
      error.message?.includes("không hợp lệ") ||
      error.message?.includes("không được để trống");

    if (isValidationError) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const notifications = await notificationService.getMyNotifications(userId, req.query);
  return sendSuccess(res, "Lấy danh sách thông báo thành công", notifications);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const unreadCount = await notificationService.getUnreadCount(userId);
  return sendSuccess(res, "Lấy số lượng thông báo chưa đọc thành công", { unreadCount });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const notification = await notificationService.markAsRead(id, userId);
  return sendSuccess(res, "Đã đánh dấu thông báo là đã đọc", notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const result = await notificationService.markAllAsRead(userId);
  return sendSuccess(res, "Đã đánh dấu tất cả thông báo là đã đọc", result);
});
