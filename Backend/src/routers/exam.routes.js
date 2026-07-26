import express from "express";
import {
  autoGenerateExam,
  createExam,
  updateExam,
  deleteExam,
  getExamsByClass,
  getAllExams,
  getExamById,
} from "../controllers/exam.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.get("/class/:classId", verifyUser, getExamsByClass);
router.get("/", verifyUser, getAllExams);
router.get("/:id", verifyUser, getExamById);

// Giáo viên và Admin có quyền Tạo/Sửa/Xóa Đề thi
router.post("/", verifyUser, isTeacher, createExam);
router.post("/generate-auto", verifyUser, isTeacher, autoGenerateExam);
router.put("/:id", verifyUser, isTeacher, updateExam);
router.delete("/:id", verifyUser, isTeacher, deleteExam);

export default router;
