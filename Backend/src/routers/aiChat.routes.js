import express from "express";
import { createSession, sendMessage, getHistory } from "../controllers/aiChat.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middlewares.js";

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
  checkAILessonAccess, // Đảm bảo người dùng có quyền với bài học này
  createSession
);

// S6: Send Message (checkAILessonAccess check quyền lúc tạo session rồi, service sẽ double check session owner)
router.post(
  "/sessions/:sessionId/messages",
  verifyUser,
  sendMessage
);

// S6: Get History
router.get(
  "/sessions/:sessionId/messages",
  verifyUser,
  getHistory
);

export default router;
