import express from "express";
import {
  generateGradeSuggestion,
  confirmGradeSuggestion,
} from "../controllers/aiGrading.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
import { checkAIQuota } from "../middlewares/aiQuota.middlewares.js";

const router = express.Router({ mergeParams: true });

// AI sinh điểm đề xuất cho 1 câu tự luận
// Cần check quota "grading"
router.post(
  "/:attemptId/questions/:questionId/grade-suggestion",
  verifyUser,
  isTeacher,
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
