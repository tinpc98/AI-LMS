import express from "express";
import { createSession, sendMessage, getHistory } from "../controllers/aiChat.controller.js";
import { verifyUser } from "#modules/auth";
import { checkAIChatLessonAccess } from "../middlewares/aiChatLessonAccess.middleware.js";
import { checkAIQuota } from "../middlewares/aiQuota.middleware.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";
import mongoose from "mongoose";

const aiChatRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id || req.user._id,
  code: "AI_RATE_LIMIT_EXCEEDED",
  message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau.",
});
import { AIError, AIErrorCode } from "../aiError.js";

// Router is mounted at /api/ai/chat
const router = express.Router();

// Middleware đặc biệt để pass lessonId từ body sang req.params cho checkAILessonAccess
const mapLessonIdParam = (req, res, next) => {
  req.params.lessonId = req.body.lessonId;
  next();
};

// S6: Create Chat Session
router.post(
  "/sessions",
  verifyUser,
  mapLessonIdParam,
  checkAIChatLessonAccess, // Đảm bảo người dùng có quyền với bài học này
  createSession
);

const validateMessageRequest = (req, res, next) => {
  const { sessionId } = req.params;
  let { message } = req.body;

  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({
      success: false,
      code: AIErrorCode.AI_INVALID_INPUT,
      message: "sessionId bắt buộc và phải là ObjectId hợp lệ.",
    });
  }

  if (message === undefined || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      success: false,
      code: AIErrorCode.AI_INVALID_INPUT,
      message: "Nội dung tin nhắn không hợp lệ.",
    });
  }

  message = message.trim();
  const maxChars = parseInt(process.env.RAG_MAX_QUESTION_CHARS) || 2000;
  if (message.length > maxChars) {
    return res.status(400).json({
      success: false,
      code: AIErrorCode.AI_INVALID_INPUT,
      message: `Nội dung tin nhắn quá dài (tối đa ${maxChars} ký tự).`,
    });
  }

  next();
};

// S6: Send Message (checkAILessonAccess check quyền lúc tạo session rồi, service sẽ double check session owner)
router.post(
  "/sessions/:sessionId/messages",
  verifyUser,
  validateMessageRequest,
  aiChatRateLimit,
  checkAIQuota("chatbot"),
  sendMessage
);

// S6: Get History
router.get("/sessions/:sessionId/messages", verifyUser, getHistory);

export default router;
