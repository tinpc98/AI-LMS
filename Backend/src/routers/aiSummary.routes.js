import { Router } from "cookie-express";
import aiSummaryController from "../controllers/aiSummary.controller.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middlewares.js";
import { checkAIQuota } from "../middlewares/aiQuota.middlewares.js";
import { aiSummaryRateLimit } from "../middlewares/aiSummaryRateLimit.middlewares.js";

const router = Router();

// GET /api/ai/lectures/:lessonId/summary
router.get(
  "/:lessonId/summary",
  requireAuth,
  checkAILessonAccess,
  aiSummaryController.getSummary
);

// POST /api/ai/lectures/:lessonId/summary
router.post(
  "/:lessonId/summary",
  requireAuth,
  checkAILessonAccess,
  aiSummaryRateLimit,
  checkAIQuota("summary"),
  aiSummaryController.generateSummary
);

// POST /api/ai/lectures/:lessonId/summary/:summaryId/approve
router.post(
  "/:lessonId/summary/:summaryId/approve",
  requireAuth,
  checkAILessonAccess,
  aiSummaryController.approveSummary
);

// POST /api/ai/lectures/:lessonId/summary/:summaryId/reject
router.post(
  "/:lessonId/summary/:summaryId/reject",
  requireAuth,
  checkAILessonAccess,
  aiSummaryController.rejectSummary
);

export default router;
