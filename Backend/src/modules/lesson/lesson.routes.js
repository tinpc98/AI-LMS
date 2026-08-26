import express from "express";
import lessonController from "./lesson.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { lessonUpload, validateLessonDocumentMagicBytes } from "./lessonUpload.middleware.js";

const router = express.Router();

// Tạo bài giảng mới
router.post("/", verifyUser, isTeacher, lessonController.createLesson);

// TÍNH NĂNG MỚI (mục 1.3): upload tài liệu để gắn vào 1 block DOCUMENT
router.post(
  "/upload-document",
  verifyUser,
  isTeacher,
  lessonUpload.single("file"),
  validateLessonDocumentMagicBytes,
  lessonController.uploadDocument
);

// TÍNH NĂNG MỚI (mục 1.4): tạo Practice Quiz để gán vào 1 block PRACTICE_QUIZ
router.post("/practice-quizzes", verifyUser, isTeacher, lessonController.createPracticeQuiz);

// Lấy danh sách bài giảng của một Topic cụ thể
router.get("/topic/:topicId", verifyUser, lessonController.getLessonsByTopic);

// Lấy danh sách bài giảng của một Class (fallback/support cho frontend)
router.get("/class/:classId", verifyUser, lessonController.getLessonsByClass);

// Lấy chi tiết bài giảng
router.get("/:id", verifyUser, lessonController.getLessonById);

// Cập nhật bài giảng
router.put("/:id", verifyUser, isTeacher, lessonController.updateLesson);

// Cập nhật trạng thái
router.patch("/:id/status", verifyUser, isTeacher, lessonController.updateLessonStatus);

// Xóa bài giảng (chặn nếu đã có tiến độ học sinh — chỉ cho archive)
router.delete("/:id", verifyUser, isTeacher, lessonController.deleteLesson);

export default router;
