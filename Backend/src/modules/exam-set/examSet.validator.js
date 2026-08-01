// File: src/modules/exam-set/examSet.validator.js
// Mười bộ validation của exam-set, tách từ src/utils/validators.js ở Wave 3.2.
// Nội dung giữ nguyên văn, chỉ đổi vị trí file và đường dẫn import.
//
// Helper stripTags đi kèm vì chỉ nhóm validation này dùng tới nó.
import { body, query, param } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";
// Lõi validation câu hỏi dùng chung với module question — xem ghi chú ở #modules/question.
import {
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  validateScore,
  validatePoints,
  validateRubricPayload,
  runCreateTypeSpecificValidators,
  runUpdateTypeSpecificValidators,
} from "#modules/question";

// Chặn client tự gửi các trường chỉ-server-được-ghi (số liệu thống kê).
const rejectClientMetrics = (field) =>
  body(field)
    .optional()
    .custom(() => {
      throw new Error(`${field} không được phép gửi từ client`);
    });

const stripTags = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.replace(/<[^>]*>/g, "").trim();
};

export const examSetShareCreateValidation = [
  body("sharedWithUserId")
    .notEmpty()
    .withMessage("sharedWithUserId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("sharedWithUserId không hợp lệ"),

  body("permission")
    .notEmpty()
    .withMessage("permission là bắt buộc")
    .bail()
    .isIn(["VIEW", "EDIT"])
    .withMessage("permission không hợp lệ"),

  body("expiresAt")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error("expiresAt phải là ngày hợp lệ");
      }
      if (d.getTime() <= Date.now()) {
        throw new Error("expiresAt phải là thời điểm tương lai");
      }
      return true;
    }),

  body("note")
    .optional()
    .isString()
    .withMessage("note phải là chuỗi")
    .trim()
    .isLength({ max: 500 })
    .withMessage("note tối đa 500 ký tự"),

  handleValidationErrors,
];

export const examSetShareRevokeValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  param("shareId")
    .notEmpty()
    .withMessage("shareId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("shareId không hợp lệ"),

  handleValidationErrors,
];

export const examSetShareListValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên lớn hơn hoặc bằng 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên từ 1 đến 100")
    .toInt(),

  query("status")
    .optional()
    .isIn(["ACTIVE", "REVOKED", "EXPIRED"])
    .withMessage("status không hợp lệ"),

  query("permission").optional().isIn(["VIEW", "EDIT"]).withMessage("permission không hợp lệ"),

  query("search")
    .optional()
    .isString()
    .withMessage("search phải là chuỗi")
    .trim()
    .isLength({ max: 100 })
    .withMessage("search không được vượt quá 100 ký tự"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "expiresAt", "status", "permission"])
    .withMessage("sortBy không hợp lệ"),

  query("sortOrder")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder không hợp lệ"),

  handleValidationErrors,
];

export const examSetSharedWithMeValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên lớn hơn hoặc bằng 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên từ 1 đến 100")
    .toInt(),

  query("permission").optional().isIn(["VIEW", "EDIT"]).withMessage("permission không hợp lệ"),

  query("search")
    .optional()
    .isString()
    .withMessage("search phải là chuỗi")
    .trim()
    .isLength({ max: 100 })
    .withMessage("search không được vượt quá 100 ký tự"),

  query("ownerId").optional().isMongoId().withMessage("ownerId không hợp lệ"),

  query("sortBy")
    .optional()
    .isIn(["sharedAt", "createdAt", "updatedAt", "expiresAt", "permission"])
    .withMessage("sortBy không hợp lệ"),

  query("sortOrder")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder không hợp lệ"),

  handleValidationErrors,
];

export const examSetTagsValidation = [
  body("tags")
    .exists({ checkFalsy: false })
    .withMessage("tags là bắt buộc")
    .isArray()
    .withMessage("tags phải là một mảng"),

  body("tags").custom((tags) => {
    if (!Array.isArray(tags)) {
      throw new Error("tags phải là một mảng");
    }

    if (tags.length > 20) {
      throw new Error("Không được phép có quá 20 tag");
    }

    const normalized = new Set();

    for (const [index, tag] of tags.entries()) {
      if (typeof tag !== "string") {
        throw new Error(`tags[${index}] phải là chuỗi`);
      }

      const trimmed = tag.trim().replace(/\s+/g, " ");
      if (trimmed === "") {
        throw new Error(`tags[${index}] không được để trống`);
      }

      const withoutHash = trimmed.replace(/^#+/, "");
      if (withoutHash === "") {
        throw new Error(`tags[${index}] không được chỉ chứa ký tự #`);
      }

      if (withoutHash.length > 30) {
        throw new Error(`tags[${index}] không được quá 30 ký tự`);
      }

      const lower = withoutHash.toLowerCase();
      if (normalized.has(lower)) {
        continue;
      }
      normalized.add(lower);
    }

    return true;
  }),

  handleValidationErrors,
];

export const examSetQuestionCreateValidation = [
  rejectClientMetrics("questionCount"),
  rejectClientMetrics("totalPoints"),
  body("questionId").trim().notEmpty().withMessage("questionId là bắt buộc"),

  body("type")
    .trim()
    .customSanitizer((value) => (typeof value === "string" ? value.trim().toLowerCase() : value))
    .notEmpty()
    .withMessage("Loại câu hỏi là bắt buộc")
    .isIn(QUESTION_TYPES)
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .isString()
    .withMessage("Content phải là chuỗi")
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content là bắt buộc")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score").optional().custom(validateScore),
  body("points").optional().custom(validatePoints),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTY_LEVELS)
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  body("suggestedAnswer")
    .optional()
    .customSanitizer(stripTags)
    .isString()
    .withMessage("suggestedAnswer phải là một chuỗi")
    .notEmpty()
    .withMessage("suggestedAnswer không được chỉ là khoảng trắng")
    .isLength({ max: 10000 })
    .withMessage("suggestedAnswer không được vượt quá 10000 ký tự"),

  ...validateRubricPayload,

  runCreateTypeSpecificValidators,
  handleValidationErrors,
];

export const examSetQuestionUpdateValidation = [
  rejectClientMetrics("questionCount"),
  rejectClientMetrics("totalPoints"),
  body("type")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(QUESTION_TYPES)
    .withMessage("Type phải là một trong các loại câu hỏi hợp lệ"),

  body("content")
    .optional()
    .customSanitizer(stripTags)
    .notEmpty()
    .withMessage("Content không được để trống")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Content phải có độ dài từ 5 đến 5000 ký tự"),

  body("score").optional().custom(validateScore),
  body("points").optional().custom(validatePoints),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(DIFFICULTY_LEVELS)
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  body("suggestedAnswer")
    .optional()
    .customSanitizer(stripTags)
    .isString()
    .withMessage("suggestedAnswer phải là một chuỗi")
    .notEmpty()
    .withMessage("suggestedAnswer không được chỉ là khoảng trắng")
    .isLength({ max: 10000 })
    .withMessage("suggestedAnswer không được vượt quá 10000 ký tự"),

  ...validateRubricPayload,

  runUpdateTypeSpecificValidators,
  handleValidationErrors,
];

export const reorderQuestionsValidation = [
  body("questions")
    .isArray({ min: 1 })
    .withMessage("questions phải là một mảng và không được rỗng"),

  body("questions.*.questionId")
    .trim()
    .notEmpty()
    .withMessage("questionId là bắt buộc cho mỗi câu hỏi"),

  body("questions.*.order")
    .isInt({ min: 0 })
    .withMessage("order phải là số nguyên không âm cho mỗi câu hỏi"),

  handleValidationErrors,
];

export const examSetVersionsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("page phải là số nguyên >= 1").toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải là số nguyên giữa 1 và 100")
    .toInt(),

  query("sort")
    .optional()
    .trim()
    .isIn(["asc", "desc"])
    .withMessage("sort chỉ chấp nhận 'asc' hoặc 'desc'"),

  handleValidationErrors,
];

/**
 * Validation for PATCH /:examSetId/shares/:shareId
 * Update share metadata: expiresAt and/or note
 */

export const examSetShareUpdateMetadataValidation = [
  param("examSetId")
    .notEmpty()
    .withMessage("examSetId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("examSetId không hợp lệ"),

  param("shareId")
    .notEmpty()
    .withMessage("shareId là bắt buộc")
    .bail()
    .isMongoId()
    .withMessage("shareId không hợp lệ"),

  // Reject unknown top-level fields (whitelist: expiresAt, note only)
  body().custom((body) => {
    const allowed = new Set(["expiresAt", "note"]);
    const unknown = Object.keys(body || {}).filter((k) => !allowed.has(k));
    if (unknown.length > 0) {
      throw new Error(`Trường không được phép: ${unknown.join(", ")}`);
    }
    // At least one known field must be present
    const hasExpiresAt = "expiresAt" in (body || {});
    const hasNote = "note" in (body || {});
    if (!hasExpiresAt && !hasNote) {
      throw new Error("Body phải chứa ít nhất một trong: expiresAt, note");
    }
    return true;
  }),

  body("expiresAt")
    .optional({ checkFalsy: false })
    .custom((value) => {
      // Allow explicit null to clear expiry
      if (value === null) return true;
      // Reject non-string/non-null types
      if (typeof value !== "string") {
        throw new Error("expiresAt phải là chuỗi ISO 8601 hoặc null");
      }
      if (value.trim() === "") {
        throw new Error("expiresAt không được là chuỗi rỗng");
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new Error("expiresAt phải là ngày hợp lệ (ISO 8601)");
      }
      if (d.getTime() <= Date.now()) {
        throw new Error("expiresAt phải là thời điểm trong tương lai");
      }
      return true;
    }),

  body("note")
    .optional({ checkFalsy: false })
    .custom((value) => {
      // Allow explicit null to clear note
      if (value === null) return true;
      if (typeof value !== "string") {
        throw new Error("note phải là chuỗi hoặc null");
      }
      if (value.trim().length > 500) {
        throw new Error("note tối đa 500 ký tự");
      }
      return true;
    }),

  handleValidationErrors,
];
