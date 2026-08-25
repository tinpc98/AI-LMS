import express from "express";
import {
  generateClassSessions,
  getClassSessions,
  getSessionDetail,
} from "./classSession.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router({ mergeParams: true });

// POST /api/classes/:classId/sessions/generate
// Currently we only check if user is logged in, but ideally we should check if admin/manager.
router.post("/generate", verifyUser, generateClassSessions);

// GET /api/classes/:classId/sessions
router.get("/", verifyUser, getClassSessions);

// GET /api/sessions/:sessionId
router.get("/:sessionId", verifyUser, getSessionDetail);

export default router;
