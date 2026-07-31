import express from "express";
import assignmentController from "../controllers/assignment.controller.js";
import { verifyUser, isTeacher, canViewSubmission } from "#shared/middlewares/auth.middleware.js";
import upload from "#shared/middlewares/upload.middleware.js";

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
router.put("/grade/:submissionId", verifyUser, isTeacher, assignmentController.gradeSubmission);

// --- Tuyến đường của Học sinh & Chung ---
// Lấy chi tiết 1 bài tập
router.get("/:id", verifyUser, assignmentController.getAssignmentById);

// Lấy danh sách bài tập theo Lớp học
router.get("/class/:classId", verifyUser, assignmentController.getAssignmentsByClass);

// Giáo viên xem danh sách bài nộp của assignment
router.get(
  "/submissions/:assignmentId",
  verifyUser,
  isTeacher,
  assignmentController.getSubmissionsByAssignment
);

// Xem chi tiết 1 bài nộp cụ thể (Giáo viên hoặc Học sinh có quyền)
router.get(
  "/submissions/detail/:submissionId",
  verifyUser,
  canViewSubmission,
  assignmentController.getSubmissionById
);

// Học sinh xem bài nộp cá nhân
router.get("/:assignmentId/my-submission", verifyUser, assignmentController.getMySubmission);

// Học sinh Nộp bài / Nộp lại bài (Đính kèm max 5 file bài làm)
router.post(
  "/submit/:assignmentId",
  verifyUser,
  upload.array("files", 5),
  assignmentController.submitAssignment
);

// Học sinh Hủy nộp bài
router.delete("/submit/:assignmentId", verifyUser, assignmentController.cancelSubmission);

export default router;
