import express from "express";
import {
  autoGenerateExam,
  createExam,
  updateExam,
  deleteExam,
  getExamsByClass,
  getAllExams,
  getExamById,
  generateFromExamSet,
} from "../controllers/exam.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Các route tĩnh (STATIC ROUTES) ĐẶT TRƯỚC
// Giáo viên và Admin có quyền Tạo/Sửa/Xóa Đề thi
router.post("/generate-from-examset", verifyUser, isTeacher, generateFromExamSet);
router.post("/generate-auto", verifyUser, isTeacher, autoGenerateExam);
router.post("/", verifyUser, isTeacher, createExam);

// 2. Các route động (DYNAMIC ROUTES) ĐẶT SAU
router.get("/class/:classId", verifyUser, getExamsByClass);
router.get("/", verifyUser, getAllExams);
router.get("/:id", verifyUser, getExamById);

router.put("/:id", verifyUser, isTeacher, updateExam);
router.delete("/:id", verifyUser, isTeacher, deleteExam);

export default router;
