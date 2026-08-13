import { body, query, param } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";

export const validateSendMessage = [
  param("classId").isMongoId().withMessage("ID lớp học không hợp lệ"),
  body("type")
    .optional()
    .isIn(["text", "image", "file"])
    .withMessage("Loại tin nhắn không hợp lệ"),
  body("content")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Nội dung tin nhắn không được vượt quá 5000 ký tự"),
  body("attachments").optional().isArray().withMessage("Đính kèm phải là một mảng"),
  body("replyTo").optional().isMongoId().withMessage("ID tin nhắn phản hồi không hợp lệ"),
  
  // Custom check: must have either content or attachments
  body().custom((value) => {
    const hasContent = value.content && value.content.trim().length > 0;
    const hasAttachments = value.attachments && value.attachments.length > 0;
    if (!hasContent && !hasAttachments) {
      throw new Error("Tin nhắn không được để trống.");
    }
    return true;
  }),
  handleValidationErrors,
];

export const validateEditMessage = [
  param("classId").isMongoId().withMessage("ID lớp học không hợp lệ"),
  param("messageId").isMongoId().withMessage("ID tin nhắn không hợp lệ"),
  body("content")
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Nội dung tin nhắn từ 1 đến 5000 ký tự"),
  handleValidationErrors,
];

export const validateGetMessages = [
  param("classId").isMongoId().withMessage("ID lớp học không hợp lệ"),
  query("cursor").optional().isMongoId().withMessage("Cursor không hợp lệ"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit từ 1 đến 50"),
  handleValidationErrors,
];
