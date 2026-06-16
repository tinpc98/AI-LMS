import { body, validationResult } from "express-validator";

export const registerValidation = [
  body("fullName")
    .trim()
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
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu là bắt buộc.")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu phải có ít nhất 8 ký tự."),
  body("role").optional().isIn(["student", "teacher"]).withMessage("Vai trò phải là student hoặc teacher."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Dữ liệu đăng ký không hợp lệ.",
        errors: errors.array().map((err) => ({ field: err.param, message: err.msg })),
      });
    }
    next();
  },
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Email không đúng định dạng!")
    .notEmpty()
    .withMessage("Email không được để trống!"),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống!"),
];
