import express from "express";
import {
  generateGradeSuggestion,
  confirmGradeSuggestion,
} from "../controllers/aiGrading.controller.js";
import { verifyUser, isTeacher } from "#shared/middlewares/auth.middleware.js";
import { checkAIQuota } from "../middlewares/aiQuota.middleware.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";

const router = express.Router({ mergeParams: true });

const aiGradingRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id || req.user._id,
  code: "AI_RATE_LIMIT_EXCEEDED",
  message: "Bạn đã gửi quá nhiều yêu cầu chấm điểm AI. Vui lòng thử lại sau.",
});

// AI sinh điểm đề xuất cho 1 câu tự luận
// Cần check quota "grading"
router.post(
  "/:attemptId/questions/:questionId/grade-suggestion",
  verifyUser,
  isTeacher,
  aiGradingRateLimit,
  checkAIQuota("grading"),
  generateGradeSuggestion
);

// Giáo viên xác nhận điểm
router.post(
  "/:attemptId/questions/:questionId/grade-confirmation",
  verifyUser,
  isTeacher,
  confirmGradeSuggestion
);

export default router;
