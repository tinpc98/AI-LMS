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
  assignmentController.createAssignment
);

// Cập nhật bài tập
router.put(
  "/:id",
  verifyUser,
  isTeacher,
  upload.array("files", 5),
  assignmentController.updateAssignment
);

// Xóa bài tập
router.delete("/:id", verifyUser, isTeacher, assignmentController.deleteAssignment);

// Chấm điểm bài nộp (Body dạng raw JSON)
router.put(
  "/grade/:submissionId",
  verifyUser,
  isTeacher,
  assignmentController.gradeSubmission
);

// --- Tuyến đường của Học sinh & Chung ---
// Lấy chi tiết 1 bài tập
router.get("/:id", verifyUser, assignmentController.getAssignmentById);

// Lấy danh sách bài tập theo Lớp học
router.get(
  "/class/:classId",
  verifyUser,
  assignmentController.getAssignmentsByClass
);

// Giáo viên xem danh sách bài nộp của assignment
router.get(
  "/submissions/:assignmentId",
  verifyUser,
  isTeacher,
  assignmentController.getSubmissionsByAssignment
);

// Học sinh Nộp bài / Nộp lại bài (Đính kèm max 5 file bài làm)
router.post(
  "/submit/:assignmentId",
  verifyUser,
  upload.array("files", 5),
  assignmentController.submitAssignment
);

// Học sinh Hủy nộp bài
router.delete(
  "/submit/:assignmentId",
  verifyUser,
  assignmentController.cancelSubmission
);

export default router;
