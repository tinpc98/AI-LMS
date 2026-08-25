import express from "express";
import lessonController from "./lesson.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

// Tạo bài giảng mới
router.post("/", verifyUser, isTeacher, lessonController.createLesson);

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

export default router;
