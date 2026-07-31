// File: src/validators/question.validator.js
import { body } from "express-validator";
import { handleValidationErrors } from "../../utils/validators.js";

// Whitelist các trường được phép sửa qua PUT /questions/:id.
// Cố tình KHÔNG khai báo createdBy — tránh giáo viên khác chiếm quyền tác giả câu hỏi.
export const updateQuestionValidation = [
  body("content")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("content không được để trống"),
  body("type").optional().isIn(["MCQ", "ESSAY"]).withMessage("type không hợp lệ"),
  body("options").optional().isArray().withMessage("options phải là mảng"),
  body("options.*").optional().isString(),
  body("correctAnswer").optional().isString(),
  body("difficulty")
    .optional()
    .isIn(["EASY", "MEDIUM", "HARD"])
    .withMessage("difficulty không hợp lệ"),
  body("topic").optional().isString().trim().notEmpty().withMessage("topic không được để trống"),
  body("tags").optional().isArray().withMessage("tags phải là mảng"),
  body("tags.*").optional().isString(),

  handleValidationErrors,
];
