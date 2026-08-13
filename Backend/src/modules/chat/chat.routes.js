import express from "express";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  uploadAttachment,
  getAttachmentSignedUrl,
  markAsRead,
  getUnreadCount,
  addReaction,
  removeReaction,
} from "./chat.controller.js";
import {
  validateGetMessages,
  validateSendMessage,
  validateEditMessage,
} from "./chat.validator.js";
import { chatUpload, validateChatMagicBytes } from "./chatUpload.middleware.js";
import { checkClassAccess } from "#modules/class/class.access.middleware.js";
import { verifyUser } from "#modules/auth/index.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";

const router = express.Router({ mergeParams: true });

// Mọi API chat đều yêu cầu đăng nhập và có quyền truy cập lớp học
router.use(verifyUser, checkClassAccess);

// Rate limiter cho gửi tin nhắn: 60 tin / phút
const messageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => `${req.user.id}_${req.params.classId}`,
  code: "MESSAGE_RATE_LIMIT",
  message: "Bạn gửi tin nhắn quá nhanh, vui lòng thử lại sau.",
});

// Rate limiter cho upload: 20 file / giờ
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `${req.user.id}_upload`,
  code: "UPLOAD_RATE_LIMIT",
  message: "Bạn đã vượt quá số lượt tải lên cho phép trong một giờ.",
});

// Lấy lịch sử chat
router.get("/", validateGetMessages, getMessages);

// Gửi tin nhắn
router.post("/", messageRateLimiter, validateSendMessage, sendMessage);

// Sửa tin nhắn
router.patch("/:messageId", validateEditMessage, editMessage);

// Xóa tin nhắn
router.delete("/:messageId", deleteMessage);

// Tải file đính kèm
router.post(
  "/attachments",
  uploadRateLimiter,
  chatUpload.single("file"),
  validateChatMagicBytes,
  uploadAttachment
);

// Lấy Signed URL của file đính kèm
router.get("/attachments/:publicId/signed-url", getAttachmentSignedUrl);

// Đánh dấu đã đọc
router.post("/read", markAsRead);

// Lấy số tin chưa đọc
router.get("/unread-count", getUnreadCount);

// Reaction
router.put("/:messageId/reactions", addReaction);
router.delete("/:messageId/reactions", removeReaction);

export default router;
