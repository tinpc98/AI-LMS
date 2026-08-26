// File: src/modules/class/cohortMechanism.routes.js
// Routes cho EduSpace mechanism design Phần A/B — mounted riêng dưới /cohort-mechanism để
// không xáo trộn class.routes.js hiện có (đang rất dài, nhiều route /:id đã tồn tại).
import { Router } from "express";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";
import {
  transitionClassCommitment,
  excuseClassCommitmentEvent,
  getCohortReadiness,
  assignClassBackupTeacher,
  activateClassBackupTeacher,
  listOverdueSessions,
  escalateSessionLevel1,
  cancelSessionAndCreateMakeup,
  listFlaggedCohorts,
} from "./cohortMechanism.controller.js";

const router = Router();

// Đọc — Admin xem trước khi quyết định (giáo viên chính/dự bị xem tình trạng lớp mình qua
// GET /classes/:id thường, không cần route riêng ở đây).
router.get("/sessions/overdue", verifyUser, isAdmin, listOverdueSessions);
router.get("/cohorts/flagged-for-review", verifyUser, isAdmin, listFlaggedCohorts);
router.get("/:id/readiness", verifyUser, isAdmin, getCohortReadiness);

// Cam kết (Phần A)
router.post("/:id/commitment/transition", verifyUser, isAdmin, transitionClassCommitment);
router.post("/commitment-events/:eventId/excuse", verifyUser, isAdmin, excuseClassCommitmentEvent);

// Dạy đôi (Phần A.6)
router.post("/:id/backup-teacher", verifyUser, isAdmin, assignClassBackupTeacher);
router.post("/:id/backup-teacher/activate", verifyUser, isAdmin, activateClassBackupTeacher);

// Leo thang (Phần B.1) — Mức 1 vẫn đi qua Admin trigger ở bản này (chưa có cron job tự động,
// xem "Chưa làm" ở đặc tả); Mức 3 huỷ + tạo buổi bù.
router.post("/sessions/:sessionId/escalate-level1", verifyUser, isAdmin, escalateSessionLevel1);
router.post(
  "/sessions/:sessionId/cancel-with-makeup",
  verifyUser,
  isAdmin,
  cancelSessionAndCreateMakeup
);

export default router;
