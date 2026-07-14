import express from "express";
import multer from "multer";
import path from "path"; // Thêm thư viện có sẵn của Node.js để đọc đuôi file
import { uploadExcelQuestions } from "../controllers/question.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // 1. In ra console để biết Postman thực chất đang gửi cái gì lên
    console.log(
      "👉 File đang upload:",
      file.originalname,
      "| Mimetype:",
      file.mimetype,
    );

    // 2. Lấy đuôi file (VD: .xlsx)
    const ext = path.extname(file.originalname).toLowerCase();

    // 3. Kiểm tra kết hợp cả 2 điều kiện cho an toàn tuyệt đối
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

router.post("/import-excel", upload.single("file"), uploadExcelQuestions);

export default router;
