import express from "express";
import aiQuestionGenerationController from "../controllers/aiQuestionGeneration.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middleware.js";
import { checkAIQuota } from "../middlewares/aiQuota.middleware.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";
import { body, validationResult } from "express-validator";

const aiQuestionRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id || req.user._id,
  code: "AI_RATE_LIMIT_EXCEEDED",
  message: "Bạn đã gửi quá nhiều yêu cầu sinh câu hỏi. Vui lòng thử lại sau.",
});

const router = express.Router({ mergeParams: true });

// Route requires Authentication
router.use(verifyUser);

// Check Lesson Access
router.use(checkAILessonAccess);

// Validators
export const validateQuestionGenerationRequest = [
  body("folderId").isMongoId().withMessage("folderId không hợp lệ"),
  body("title").notEmpty().withMessage("title không được để trống").isString(),
  body("questionCount")
    .isInt({ min: 1, max: 100 })
    .withMessage("questionCount phải là số từ 1 đến 100"),
  body("questionTypes").custom((questionTypes, { req }) => {
    if (!questionTypes || typeof questionTypes !== "object" || Array.isArray(questionTypes)) {
      throw new Error("questionTypes phải là object");
    }
    const supportedTypes = new Set(["multiple_choice", "true_false", "short_answer", "essay"]);
    const entries = Object.entries(questionTypes);
    for (const [type, count] of entries) {
      if (!supportedTypes.has(type)) {
        throw new Error(`Loại câu hỏi không được hỗ trợ: ${type}`);
      }
      if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Số lượng ${type} phải là số nguyên không âm`);
      }
    }
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total !== Number(req.body.questionCount)) {
      throw new Error("Tổng questionTypes phải bằng questionCount");
    }
    return true;
  }),
  body("difficultyDistribution").custom((difficultyDistribution, { req }) => {
    if (
      !difficultyDistribution ||
      typeof difficultyDistribution !== "object" ||
      Array.isArray(difficultyDistribution)
    ) {
      throw new Error("difficultyDistribution phải là object");
    }
    const supportedDifficulties = new Set(["easy", "medium", "hard"]);
    const entries = Object.entries(difficultyDistribution);
    for (const [diff, count] of entries) {
      if (!supportedDifficulties.has(diff)) {
        throw new Error(`Độ khó không được hỗ trợ: ${diff}`);
      }
      if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Số lượng độ khó ${diff} phải là số nguyên không âm`);
      }
    }
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total !== Number(req.body.questionCount)) {
      throw new Error("Tổng difficultyDistribution phải bằng questionCount");
    }
    return true;
  }),
];

export const handleQuestionGenerationValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "AI_INVALID_INPUT",
      message: "Tham số đầu vào không hợp lệ",
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/ai/lectures/:lessonId/question-sets/generate
 * Sinh câu hỏi bằng AI
 */
router.post(
  "/generate",
  isTeacher,
  validateQuestionGenerationRequest,
  handleQuestionGenerationValidation,
  aiQuestionRateLimit,
  checkAIQuota("question-gen"),
  aiQuestionGenerationController.generateQuestionSet
);

export default router;
