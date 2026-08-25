// File: src/validators/class.validator.js
import { body } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";

// Chỉ khai báo (whitelist) các trường Admin được phép sửa qua route PUT /:id chung.
// Cố tình KHÔNG khai báo: teacherId, assignedBy, assignedAt, students, currentStudents,
// isDeleted, courseId, resources — các trường này có luồng nghiệp vụ riêng
// (AssignTeacher, AssignStudent, AddResource, DeleteClass,...) với kiểm tra quyền/điều kiện
// riêng, không được phép bị ghi đè trực tiếp qua update chung chung.
export const updateClassValidation = [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Tên lớp học tối thiểu 3 ký tự"),
  body("code").optional().isString().trim(),
  body("classRoom").optional().isString().trim(),
  body("mode")
    .optional()
    .isIn(["OFFLINE", "ONLINE"])
    .withMessage("mode không hợp lệ"),
  body("schedule").optional().isObject().withMessage("schedule phải là object"),
  body("gradingWeight").optional().isObject().withMessage("gradingWeight phải là object"),
  body("level")
    .optional()
    .isIn(["FOUNDATION", "INTERMEDIATE", "ADVANCED"])
    .withMessage("level không hợp lệ"),

  body("startDate").optional({ nullable: true }).isISO8601().withMessage("startDate không hợp lệ"),
  body("endDate").optional({ nullable: true }).isISO8601().withMessage("endDate không hợp lệ"),
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("capacity phải là số nguyên >= 1"),
  body("description").optional().isString().trim(),
  body("note").optional().isString().trim(),
  body("isEnrollmentOpen").optional().isBoolean().withMessage("isEnrollmentOpen phải là boolean"),
  body("status")
    .optional()
    .isIn(["DRAFT", "OPEN", "FULL", "CLOSED", "ARCHIVED"])
    .withMessage("status không hợp lệ"),
  body("googleMeetLink").optional().isString().trim(),
  body("googleCalendarEventId").optional().isString().trim(),

  handleValidationErrors,
];
