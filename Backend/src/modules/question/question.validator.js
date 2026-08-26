import { body } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
  "MCQ",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
];
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard", "EASY", "MEDIUM", "HARD"];

export const validateScore = (value) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error("Score phải là số hợp lệ và không được âm");
  }
  return true;
};

export const validatePoints = (value) => {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error("Points phải là số hợp lệ và không được âm");
  }
  return true;
};

// Rubric: mảng {criterion, maxScore} — mỗi tiêu chí phải có tên (không trùng nhau, so sánh
// không phân biệt hoa/thường và khoảng trắng đầu/cuối) và maxScore > 0; tổng maxScore không
// được vượt quá score của câu hỏi (một rubric chấm quá điểm tối đa của câu là vô nghĩa).
export const validateRubricPayload = [
  body("rubric")
    .optional()
    .custom((rubric, { req }) => {
      if (!Array.isArray(rubric)) {
        throw new Error("Rubric phải là một mảng");
      }
      if (rubric.length < 1 || rubric.length > 20) {
        throw new Error("Rubric phải là mảng có tối thiểu 1 và tối đa 20 tiêu chí");
      }

      const seenCriteria = new Set();
      let total = 0;
      for (let i = 0; i < rubric.length; i++) {
        const item = rubric[i] || {};
        const criterion = typeof item.criterion === "string" ? item.criterion.trim() : "";
        if (!criterion) {
          throw new Error(`rubric[${i}].criterion là bắt buộc`);
        }
        const key = criterion.toLowerCase();
        if (seenCriteria.has(key)) {
          throw new Error("rubric không được có tiêu chí trùng nhau");
        }
        seenCriteria.add(key);

        if (typeof item.maxScore !== "number" || Number.isNaN(item.maxScore)) {
          throw new Error(`rubric[${i}].maxScore là bắt buộc và phải là số`);
        }
        if (item.maxScore <= 0) {
          throw new Error(`rubric[${i}].maxScore phải lớn hơn 0`);
        }
        total += item.maxScore;
      }

      const score = req.body.score !== undefined ? Number(req.body.score) : undefined;
      if (score !== undefined && !Number.isNaN(score) && total > score) {
        throw new Error("Tổng rubric không được lớn hơn score của câu hỏi");
      }

      return true;
    }),
];

// ESSAY không dùng cơ chế chọn đáp án (options/correctAnswer) — đây là kiểm tra ở tầng payload
// thô, bổ sung cho ensureEssayQuestionFieldsAllowed ở examSetQuestion.service.js (tầng đó kiểm
// tra sâu hơn khi đã có context câu hỏi hiện có, tầng này chặn sớm ngay từ request).
const rejectEssayOptionFields = (req, res) => {
  const type = String(req.body?.type || "")
    .trim()
    .toLowerCase();
  if (type !== "essay") return null;

  if (req.body.options !== undefined) {
    return { field: "options", message: "ESSAY không sử dụng options" };
  }
  if (req.body.correctAnswer !== undefined) {
    return { field: "correctAnswer", message: "ESSAY không sử dụng correctAnswer" };
  }
  return null;
};

const sendTypeSpecificError = (res, error) =>
  res.status(400).json({
    success: false,
    message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
    errors: [error],
  });

export const runCreateTypeSpecificValidators = (req, res, next) => {
  const error = rejectEssayOptionFields(req, res);
  if (error) return sendTypeSpecificError(res, error);
  next();
};

export const runUpdateTypeSpecificValidators = (req, res, next) => {
  const error = rejectEssayOptionFields(req, res);
  if (error) return sendTypeSpecificError(res, error);
  next();
};

export const multipleChoiceQuestionValidation = [
  body("content")
    .customSanitizer((value) => (typeof value === "string" ? value.trim() : value))
    .notEmpty()
    .withMessage("Content là bắt buộc"),

  body("options").custom((options) => {
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error("Phải có tối thiểu 2 options");
    }
    const ids = options.map((opt) => opt?.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("Option id không được trùng nhau");
    }
    return true;
  }),

  body("correctAnswer").custom((correctAnswer, { req }) => {
    const options = Array.isArray(req.body.options) ? req.body.options : [];
    const exists = options.some((opt) => opt?.id === correctAnswer);
    if (!exists) {
      throw new Error("correctAnswer phải tồn tại trong options");
    }
    return true;
  }),

  body("points")
    .optional()
    .custom((value) => {
      if (Number(value) < 0) {
        throw new Error("Score phải lớn hơn hoặc bằng 0");
      }
      return true;
    }),

  body("difficulty")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty phải thuộc enum easy, medium, hard"),

  handleValidationErrors,
];

const validateContentBlocks = (blocks) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("Phải có ít nhất 1 ContentBlock");
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.id || typeof block.order !== "number") {
      throw new Error(`ContentBlock[${i}] thiếu id hoặc order hợp lệ`);
    }

    if (block.type === "TEXT") {
      if (typeof block.text !== "string" || block.text.trim() === "") {
        throw new Error(`ContentBlock[${i}] kiểu TEXT thiếu thuộc tính text`);
      }
    } else if (block.type === "FORMULA") {
      if (typeof block.latex !== "string" || block.latex.trim() === "") {
        throw new Error(`ContentBlock[${i}] kiểu FORMULA thiếu thuộc tính latex`);
      }
      if (!["INLINE", "BLOCK"].includes(block.displayMode)) {
        throw new Error(`ContentBlock[${i}] kiểu FORMULA có displayMode không hợp lệ`);
      }
      // Security Validation cho FORMULA
      const lowerLatex = block.latex.toLowerCase();
      if (lowerLatex.includes("<script") || lowerLatex.includes("javascript:")) {
        throw new Error(`ContentBlock[${i}] kiểu FORMULA chứa payload nguy hiểm (XSS)`);
      }
    } else if (block.type === "IMAGE") {
      if (!block.image || !block.image.url || typeof block.image.url !== "string") {
        throw new Error(`ContentBlock[${i}] kiểu IMAGE thiếu thuộc tính image.url`);
      }
    } else {
      throw new Error(`ContentBlock[${i}] có type không hợp lệ: ${block.type}`);
    }
  }
  return true;
};

const validateOptions = (options, { req }) => {
  const type = req.body.type;
  if (type !== "MCQ") return true;

  if (!Array.isArray(options) || options.length < 2) {
    throw new Error("MCQ phải có tối thiểu 2 options");
  }

  let correctCount = 0;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!opt.id || typeof opt.order !== "number") {
      throw new Error(`Option[${i}] thiếu id hoặc order hợp lệ`);
    }
    if (!opt.content || !Array.isArray(opt.content)) {
      throw new Error(`Option[${i}] thiếu content block hợp lệ`);
    }
    validateContentBlocks(opt.content);

    if (opt.isCorrect === true) {
      correctCount++;
    }
  }

  const selectionMode = req.body.selectionMode;
  if (selectionMode === "SINGLE" && correctCount !== 1) {
    throw new Error("MCQ (SINGLE mode) phải có đúng 1 đáp án đúng");
  }
  if (selectionMode === "MULTIPLE" && correctCount < 1) {
    throw new Error("MCQ (MULTIPLE mode) phải có ít nhất 1 đáp án đúng");
  }

  return true;
};

// ==========================================
// CREATE QUESTION VALIDATOR
// ==========================================
export const createQuestionValidation = [
  body("topicId").isMongoId().withMessage("topicId không hợp lệ"),

  body("type")
    .isIn(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"])
    .withMessage("Loại câu hỏi không hợp lệ"),

  body("selectionMode")
    .optional()
    .isIn(["SINGLE", "MULTIPLE"])
    .withMessage("selectionMode không hợp lệ"),

  body("content").custom(validateContentBlocks),

  body("options").optional().custom(validateOptions),

  body("difficulty")
    .optional()
    .isIn(["EASY", "MEDIUM", "HARD"])
    .withMessage("difficulty không hợp lệ"),

  body("points").optional().isFloat({ min: 0 }).withMessage("points phải >= 0"),

  body("explanation")
    .optional()
    .custom((blocks) => {
      if (blocks && blocks.length > 0) {
        return validateContentBlocks(blocks);
      }
      return true;
    }),

  body("tags").optional().isArray().withMessage("tags phải là mảng"),

  handleValidationErrors,
];

// ==========================================
// UPDATE QUESTION VALIDATOR
// ==========================================
export const updateQuestionValidation = [
  body("topicId").optional().isMongoId().withMessage("topicId không hợp lệ"),

  body("type")
    .optional()
    .isIn(["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"])
    .withMessage("Loại câu hỏi không hợp lệ"),

  body("selectionMode")
    .optional()
    .isIn(["SINGLE", "MULTIPLE"])
    .withMessage("selectionMode không hợp lệ"),

  body("content").optional().custom(validateContentBlocks),

  body("options").optional().custom(validateOptions),

  body("difficulty")
    .optional()
    .isIn(["EASY", "MEDIUM", "HARD"])
    .withMessage("difficulty không hợp lệ"),

  body("points").optional().isFloat({ min: 0 }).withMessage("points phải >= 0"),

  body("explanation")
    .optional()
    .custom((blocks) => {
      if (blocks && blocks.length > 0) {
        return validateContentBlocks(blocks);
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
    .withMessage("status không hợp lệ"),

  body("tags").optional().isArray().withMessage("tags phải là mảng"),

  handleValidationErrors,
];
