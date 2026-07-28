import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseTrash,
  restoreCourse,
  permanentDeleteCourse,
} from "../controllers/course.controller.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

// Tất cả người dùng đã đăng nhập có thể xem danh sách khóa học (dùng cho dropdown/xem danh sách)
router.get("/", verifyUser, getCourses);
router.get("/:id", verifyUser, getCourseById);

// Chỉ Admin mới được phép quản lý toàn diện khóa học
router.get("/trash", verifyUser, isAdmin, getCourseTrash);
router.post("/", verifyUser, isAdmin, createCourse);
router.put("/:id", verifyUser, isAdmin, updateCourse);
router.delete("/:id", verifyUser, isAdmin, deleteCourse);
router.patch("/:id/restore", verifyUser, isAdmin, restoreCourse);
router.delete("/:id/force", verifyUser, isAdmin, permanentDeleteCourse);

export default router;
