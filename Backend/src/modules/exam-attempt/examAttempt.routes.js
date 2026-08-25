import express from "express";
import * as examAttemptController from "./examAttempt.controller.js";
import { saveDraft } from "./draftAnswers.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

router.use(verifyUser);

// ── Static routes (phải đứng TRƯỚC /:attemptId để không bị match nhầm) ──
// Teacher: lấy danh sách attempt theo exam
router.get("/exam/:examId", isTeacher, examAttemptController.getAttemptsByExam);

// ── Dynamic routes ──
router.get("/:attemptId", examAttemptController.getAttempt);
router.patch("/:attemptId/questions/:questionId", examAttemptController.saveAnswer);
router.patch("/:attemptId/answers", saveDraft);
router.post("/:attemptId/submit", examAttemptController.submitExam);
router.post("/:attemptId/cheat", examAttemptController.reportCheat);
router.post("/:attemptId/heartbeat", examAttemptController.heartbeat);

// Teacher routes
router.get("/:attemptId/review", isTeacher, examAttemptController.getAttemptForReview);
router.put("/:attemptId/grade-essay", isTeacher, examAttemptController.gradeEssay);

export default router;
