import express from "express";
import {
  submitExam,
  startExam,
  gradeEssaySubmit,
  getAttemptForReview,
  getExamAttemptDetail,
  getAttemptsByExam,
  recordCheatWarning,
} from "./examAttempt.controller.js";
import { saveDraft } from "./draftAnswers.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

// --- Tuyến đường dành cho Học sinh ---
router.post("/start", verifyUser, startExam);
router.post("/:id/submit", verifyUser, submitExam);
router.get("/:id", verifyUser, getExamAttemptDetail);
router.post("/:id/warning", verifyUser, recordCheatWarning);
// Lưu tạm bài làm. PATCH vì đây là cập nhật MỘT PHẦN — máy khách gửi từng câu khi học sinh
// chọn, không gửi lại toàn bộ bài.
router.patch("/:id/answers", verifyUser, saveDraft);

// --- Tuyến đường dành cho Giáo viên / Admin ---
router.put("/:id/grade-essay", verifyUser, isTeacher, gradeEssaySubmit);
router.get("/:id/review", verifyUser, isTeacher, getAttemptForReview);
router.get("/exam/:examId", verifyUser, isTeacher, getAttemptsByExam);

export default router;
