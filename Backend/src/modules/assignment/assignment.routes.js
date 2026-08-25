import express from "express";
import * as assignmentController from "./assignment.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { checkAssignmentAccess } from "./assignmentAuth.middleware.js";

const router = express.Router();

// Teacher routes
router.post("/", verifyUser, isTeacher, assignmentController.createAssignment);
router.get("/:id/teacher-attempts", verifyUser, isTeacher, checkAssignmentAccess, assignmentController.getAttemptsForTeacher);
router.patch("/:id/publish", verifyUser, isTeacher, checkAssignmentAccess, assignmentController.publishAssignment);

// Shared/Student routes
router.get("/:id", verifyUser, checkAssignmentAccess, assignmentController.getAssignmentById);
router.post("/:id/attempts", verifyUser, checkAssignmentAccess, assignmentController.startAttempt);
router.get("/:id/attempts", verifyUser, checkAssignmentAccess, assignmentController.getAttemptHistory);

// Attempt specific routes
router.get("/attempts/:attemptId", verifyUser, assignmentController.getAttempt);
router.patch("/attempts/:attemptId/questions/:questionId", verifyUser, assignmentController.saveAnswer);
router.post("/attempts/:attemptId/submit", verifyUser, assignmentController.submitAttempt);
router.patch("/attempts/:attemptId/questions/:questionId/grade", verifyUser, isTeacher, assignmentController.gradeEssay);

export default router;
