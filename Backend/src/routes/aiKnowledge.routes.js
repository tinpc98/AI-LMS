import express from "express";
import { indexLessonKnowledge, getIndexStatus } from "../controllers/aiKnowledge.controller.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middleware.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

// Router is mounted at /api/ai/lessons
const router = express.Router({ mergeParams: true });

// S6: Index lesson knowledge (Only Teacher/Admin)
router.post(
  "/:lessonId/knowledge/index",
  verifyUser,
  isTeacher,
  checkAILessonAccess, // Đảm bảo thuộc lớp mình dạy
  indexLessonKnowledge
);

// S6: Get Index Status
router.get(
  "/:lessonId/knowledge/status",
  verifyUser,
  isTeacher,
  checkAILessonAccess,
  getIndexStatus
);

export default router;
