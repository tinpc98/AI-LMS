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

export const registerValidation = [
  body("fullName")
    .trim() // Xóa khoảng trắng 2 đầu của họ tên
    .notEmpty()
    .withMessage("Họ và tên là bắt buộc.")
    .isLength({ min: 3 })
    .withMessage("Họ và tên tối thiểu 3 ký tự."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email là bắt buộc.")
    .isEmail()
    .withMessage("Email không hợp lệ.")
    .normalizeEmail(), // Tự động đưa về chữ thường viết liền chuẩn hóa

  body("password")
    .notEmpty()
    .withMessage("Mật khẩu là bắt buộc.")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải có ít nhất 8 ký tự.")
    .custom((value) => {
      // Bẫy bảo mật: Kiểm tra nếu mật khẩu sau khi thử trim() mà trống rỗng -> Toàn dấu cách
      if (value.trim().length === 0) {
        throw new Error("Mật khẩu không được phép chỉ chứa ký tự khoảng trắng.");
      }
      return true; // Hợp lệ (mật khẩu có chữ xen lẫn dấu cách vẫn chấp nhận)
    }),

  body("role").optional().isIn(["student", "teacher"]).withMessage("Vai trò phải là student hoặc teacher."),

  handleValidationErrors, // Thêm chốt chặn xử lý kết quả lỗi
];

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
