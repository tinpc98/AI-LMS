import { Router } from "express";
import {
  upsertGrade,
  getGradesByClass,
  getGradesByStudent,
  getStudentGPA,
} from "../controllers/grade.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

// Giáo viên / Admin nhập/cập nhật điểm số
router.post("/", verifyUser, isTeacher, upsertGrade);

// Xem bảng điểm của lớp (Giáo viên / Admin)
router.get("/class/:classId", verifyUser, isTeacher, getGradesByClass);

// Xem bảng điểm cá nhân của học sinh
router.get("/student/:studentId", verifyUser, getGradesByStudent);

// Tính điểm tổng kết GPA môn học (Hỗ trợ cả 2 định dạng route FE gọi)
router.get("/gpa/class/:classId/student/:studentId", verifyUser, getStudentGPA);
router.get("/gpa/:classId/:studentId", verifyUser, getStudentGPA);

export default router;
