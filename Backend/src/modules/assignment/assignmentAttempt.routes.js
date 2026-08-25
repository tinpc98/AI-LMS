import express from "express";
import * as assignmentController from "./assignment.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

router.use(verifyUser);

router.get("/:attemptId", assignmentController.getAttempt);
router.patch("/:attemptId/questions/:questionId", assignmentController.saveAnswer);
router.post("/:attemptId/submit", assignmentController.submitAttempt);

// Teacher grading
router.patch("/:attemptId/questions/:questionId/grade", isTeacher, assignmentController.gradeEssay);

export default router;
