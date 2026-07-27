import express from "express";
import {
  submitExam,
  startExam,
  gradeEssaySubmit,
  getAttemptForReview,
  getExamAttemptDetail,
  getAttemptsByExam,
  recordCheatWarning,
} from "../controllers/examAttempt.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// --- Tuyến đường dành cho Học sinh ---
router.post("/start", verifyUser, startExam);
router.post("/:id/submit", verifyUser, submitExam);
router.get("/:id", verifyUser, getExamAttemptDetail);
router.post("/:id/warning", verifyUser, recordCheatWarning);

// --- Tuyến đường dành cho Giáo viên / Admin ---
router.put("/:id/grade-essay", verifyUser, isTeacher, gradeEssaySubmit);
router.get("/:id/review", verifyUser, isTeacher, getAttemptForReview);
router.get("/exam/:examId", verifyUser, isTeacher, getAttemptsByExam);

export default router;
