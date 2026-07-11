import express from "express";
import assignmentController from "../controllers/assignment.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/upload.middlewares.js";

const router = express.Router();

// --- Tuyến đường của Giáo viên ---
// Tạo bài tập (Đính kèm max 5 file)
router.post(
  "/",
  verifyUser,
  isTeacher,
  upload.array("files", 5),
  assignmentController.createAssignment,
);

// Chấm điểm bài nộp (Body dạng raw JSON)
router.put(
  "/grade/:submissionId",
  verifyUser,
  isTeacher,
  assignmentController.gradeSubmission,
);

// --- Tuyến đường của Học sinh & Chung ---
// Lấy danh sách bài tập theo Lớp học
router.get(
  "/class/:classId",
  verifyUser,
  assignmentController.getAssignmentsByClass,
);

// Học sinh Nộp bài / Nộp lại bài (Đính kèm max 5 file bài làm)
router.post(
  "/submit/:assignmentId",
  verifyUser,
  upload.array("files", 5),
  assignmentController.submitAssignment,
);

export default router;
