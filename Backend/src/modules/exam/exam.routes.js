import express from "express";
import * as examController from "./exam.controller.js";
import * as examAttemptController from "../exam-attempt/examAttempt.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

// Teacher: CRUD exam
router.post("/", verifyUser, isTeacher, examController.createExam);
router.put("/:id", verifyUser, isTeacher, examController.updateExam);
router.delete("/:id", verifyUser, isTeacher, examController.deleteExam);

// Phải đặt TRƯỚC /:id để tránh match sai
router.get("/class/:classId", verifyUser, examController.getExamsByClass);
router.get("/my", verifyUser, examController.getMyExams);

router.get("/:id", verifyUser, examController.getExamById);

// Student exam flow (mounted at /api/exams/:examId/...)
router.post("/:examId/start", verifyUser, examAttemptController.startExam);
router.get("/:examId/my-results", verifyUser, examAttemptController.getMyResults);

export default router;
