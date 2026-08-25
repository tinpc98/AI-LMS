import { Router } from "express";
import subjectController from "./subject.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(verifyUser);

// ── GET ──────────────────────────────────────────────────────────────────────
router.get("/", subjectController.getSubjects);
router.get("/:id", subjectController.getSubjectById);

// ── QUẢN LÝ CỦA ADMIN ────────────────────────────────────────────────────────
router.post("/", isAdmin, subjectController.createSubject);
router.patch("/:id", isAdmin, subjectController.updateSubject);
router.patch("/:id/activate", isAdmin, subjectController.activateSubject);
router.patch("/:id/archive", isAdmin, subjectController.archiveSubject);

export default router;
