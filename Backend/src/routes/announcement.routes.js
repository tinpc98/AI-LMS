import { Router } from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middleware.js";

const router = Router();

// Xem danh sách thông báo & Chi tiết (cho tất cả người dùng đã đăng nhập)
router.get("/", verifyUser, getAnnouncements);

// Endpoint đánh dấu đã đọc thông báo (cho Notification Center)
router.patch("/read-all", verifyUser, (req, res) => {
  return res.status(200).json({ success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc" });
});
router.patch("/:id/read", verifyUser, (req, res) => {
  return res.status(200).json({ success: true, message: "Đã đánh dấu thông báo là đã đọc" });
});

router.get("/:id", verifyUser, getAnnouncementById);

// Giáo viên và Admin có quyền đăng thông báo
router.post("/", verifyUser, isTeacher, createAnnouncement);
router.put("/:id", verifyUser, isTeacher, updateAnnouncement);
router.delete("/:id", verifyUser, isTeacher, deleteAnnouncement);

export default router;
