import { body } from "express-validator";
import { handleValidationErrors } from "#shared/middlewares/validate.middleware.js";

export const QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "essay", "MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"];
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard", "EASY", "MEDIUM", "HARD"];

export const validateScore = (value) => { return true; };
export const validatePoints = (value) => { return true; };
export const validateRubricPayload = [];
export const runCreateTypeSpecificValidators = async (req, res, next) => next();
export const runUpdateTypeSpecificValidators = async (req, res, next) => next();
export const multipleChoiceQuestionValidation = [];

const validateContentBlocks = (blocks) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("Phải có ít nhất 1 ContentBlock");
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.id || typeof block.order !== 'number') {
      throw new Error(`ContentBlock[${i}] thiếu id hoặc order hợp lệ`);
    }

    if (block.type === "TEXT") {
      if (typeof block.text !== 'string' || block.text.trim() === "") {
        throw new Error(`ContentBlock[${i}] kiểu TEXT thiếu thuộc tính text`);
      }
    } else if (block.type === "FORMULA") {
      if (typeof block.latex !== 'string' || block.latex.trim() === "") {
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
      if (!block.image || !block.image.url || typeof block.image.url !== 'string') {
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
    if (!opt.id || typeof opt.order !== 'number') {
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

  body("points")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("points phải >= 0"),

  body("explanation")
    .optional()
    .custom((blocks) => {
      if (blocks && blocks.length > 0) {
        return validateContentBlocks(blocks);
      }
      return true;
    }),

  body("tags").optional().isArray().withMessage("tags phải là mảng"),

  handleValidationErrors
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

  body("points")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("points phải >= 0"),

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

  handleValidationErrors
];
