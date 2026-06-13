import { body } from "express-validator";
export const ProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Tên không để trống và > 6 ký tự"),
  body("price")
    .trim()
    .isFloat({ min: 0 })
    .withMessage("Giá phải là số và không âm"),
];
export const RegisterValidation = [
  body("name")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Tên không để trống và > 6 ký tự"),
  body("email").trim().notEmpty().isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu tối thiểu 6 kí tự"),
];
export const LoginValidation = [
  body("email").trim().notEmpty().isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Mật khẩu tối thiểu 6 kí tự"),
];
