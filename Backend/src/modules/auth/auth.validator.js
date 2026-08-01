// File: src/modules/auth/auth.validator.js
// Tách từ src/utils/validators.js ở Wave 3.2 — nội dung giữ nguyên văn.
import { body } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống!")
    .isEmail()
    .withMessage("Email không đúng định dạng!")
    .normalizeEmail(), // Đồng bộ normalize để luôn tìm kiếm dạng chữ thường

  body("password").notEmpty().withMessage("Mật khẩu không được để trống!"),

  handleValidationErrors, // Thêm chốt chặn xử lý kết quả lỗi (Em từng thiếu chỗ này)
];
