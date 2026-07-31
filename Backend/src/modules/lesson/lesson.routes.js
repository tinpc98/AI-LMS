import express from "express";
import lessonController from "./lesson.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js"; // Nhớ thêm đuôi .js tùy theo file của bạn
import upload from "#shared/middlewares/upload.middleware.js";

const router = express.Router();

// Tạo bài giảng mới (Tối đa 5 files đính kèm)
router.post("/", verifyUser, isTeacher, upload.array("files", 5), lessonController.createLesson);

// Lấy toàn bộ bài giảng của một lớp học cụ thể
router.get("/class/:classId", verifyUser, lessonController.getLessonsByClass);

// Cập nhật bài giảng
router.put("/:id", verifyUser, isTeacher, upload.array("files", 5), lessonController.updateLesson);

// Xóa bài giảng
router.delete("/:id", verifyUser, isTeacher, lessonController.deleteLesson);

export default router;
