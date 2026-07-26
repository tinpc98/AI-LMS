import { Router } from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = Router();

// Xem danh sách thông báo & Chi tiết (cho tất cả người dùng đã đăng nhập)
router.get("/", verifyUser, getAnnouncements);
router.get("/:id", verifyUser, getAnnouncementById);

// Giáo viên và Admin có quyền đăng thông báo
router.post("/", verifyUser, isTeacher, createAnnouncement);
router.put("/:id", verifyUser, isTeacher, updateAnnouncement);
router.delete("/:id", verifyUser, isTeacher, deleteAnnouncement);

export default router;
