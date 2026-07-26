import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

// Tất cả người dùng đã đăng nhập có thể xem danh sách khóa học (dùng cho dropdown/xem danh sách)
router.get("/", verifyUser, getCourses);
router.get("/:id", verifyUser, getCourseById);

// Chỉ Admin mới được phép Tạo, Cập nhật và Xóa khóa học
router.post("/", verifyUser, isAdmin, createCourse);
router.put("/:id", verifyUser, isAdmin, updateCourse);
router.delete("/:id", verifyUser, isAdmin, deleteCourse);

export default router;
