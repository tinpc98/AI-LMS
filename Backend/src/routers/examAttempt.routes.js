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

const router = express.Router();

// Học sinh gửi bài làm lên để nộp và chấm điểm
// :id ở đây là ID của ExamAttempt (phiên làm bài)
router.post("/start", startExam);

router.post("/:id/submit", submitExam);

router.put("/:id/grade-essay", gradeEssaySubmit);

router.get("/:id/review", getAttemptForReview);

router.get("/:id", getExamAttemptDetail);
router.get("/exam/:examId", getAttemptsByExam);
router.post("/:id/warning", recordCheatWarning);
export default router;
