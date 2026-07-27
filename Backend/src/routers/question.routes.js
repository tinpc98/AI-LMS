import express from "express";
import multer from "multer";
import path from "path";
import {
  uploadExcelQuestions,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    console.log(
      "👉 File đang upload:",
      file.originalname,
      "| Mimetype:",
      file.mimetype,
    );

    const ext = path.extname(file.originalname).toLowerCase();

    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      ext === ".xlsx" ||
      ext === ".xls"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx hoặc .xls)!"), false);
    }
  },
});

// Tất cả các thao tác trên Ngân hàng câu hỏi bắt buộc phải đăng nhập và có quyền Giáo viên / Admin
router.post("/import-excel", verifyUser, isTeacher, upload.single("file"), uploadExcelQuestions);
router.get("/", verifyUser, isTeacher, getQuestions);
router.post("/", verifyUser, isTeacher, createQuestion);
router.put("/:id", verifyUser, isTeacher, updateQuestion);
router.delete("/:id", verifyUser, isTeacher, deleteQuestion);

export default router;
