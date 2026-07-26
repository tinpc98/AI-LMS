import { Router } from "express";
import {
  markAttendance,
  updateAttendance,
  getAttendanceByClass,
  getAttendanceByStudent,
  getAttendanceStats,
} from "../controllers/attendance.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = Router();

// Giáo viên / Admin thực hiện điểm danh
router.post("/", verifyUser, isTeacher, markAttendance);
router.put("/:id", verifyUser, isTeacher, updateAttendance);

// Xem danh sách điểm danh theo lớp
router.get("/class/:classId", verifyUser, getAttendanceByClass);

// Xem lịch sử điểm danh cá nhân hoặc theo học sinh
router.get("/student/:studentId", verifyUser, getAttendanceByStudent);

// Xem thống kê tỷ lệ điểm danh của lớp
router.get("/stats/class/:classId", verifyUser, isTeacher, getAttendanceStats);

export default router;
