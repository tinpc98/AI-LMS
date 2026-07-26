import { body, validationResult } from "express-validator";

// Middleware tập trung hứng lỗi và trả về cho Frontend
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
      // Sử dụng err.path cho các phiên bản mới, bọc lót err.param nếu dùng bản cũ
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

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
