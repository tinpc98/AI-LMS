import { AIError, AIErrorCode } from "../../utils/aiError.js";

// Helper to safely parse config with strict bounds
function getSafeInt(value, defaultValue, maxCeiling) {
  let parsed = parseInt(value, 10);
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    parsed = defaultValue;
  }
  return Math.min(parsed, maxCeiling);
}

// Config limits
export const AI_MAX_QUESTION_COUNT = getSafeInt(process.env.AI_MAX_QUESTION_COUNT, 30, 30);
export const AI_MAX_INPUT_CHARS = getSafeInt(process.env.AI_MAX_INPUT_CHARS, 60000, 100000);
export const AI_MAX_ESTIMATED_INPUT_TOKENS = getSafeInt(process.env.AI_MAX_ESTIMATED_INPUT_TOKENS, 20000, 30000);
export const AI_MAX_GRADING_ANSWER_CHARS = getSafeInt(process.env.AI_MAX_GRADING_ANSWER_CHARS, 12000, 20000);

export class AIInputBudget {
  /**
   * Normalize text and remove unwanted invisible characters
   */
  static normalizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text.normalize("NFC").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  }

  /**
   * Very rough estimation of tokens. (Approximately 1 token = 3-4 chars for VN, 4 chars for EN)
   * This is a conservative estimate to prevent exceeding LLM limits.
   */
  static estimateTokens(text) {
    if (!text) return 0;
    // Assume conservative 3 characters per token on average for mixed VI/EN
    return Math.ceil(text.length / 3);
  }

  /**
   * Check Question Count specifically
   */
  static validateQuestionCount(count) {
    const num = Number(count);
    if (!Number.isInteger(num) || num < 1 || num > AI_MAX_QUESTION_COUNT) {
      throw new AIError(
        `Số lượng câu hỏi không hợp lệ. Vui lòng chọn từ 1 đến ${AI_MAX_QUESTION_COUNT} câu.`,
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }
  }

  /**
   * Validate generic text budget
   */
  static validateTextBudget(text, featureName = "AI") {
    const chars = text ? text.length : 0;
    if (chars > AI_MAX_INPUT_CHARS) {
      throw new AIError(
        `Nội dung đầu vào cho ${featureName} quá dài (${chars} ký tự). Vượt giới hạn an toàn ${AI_MAX_INPUT_CHARS} ký tự.`,
        AIErrorCode.AI_INVALID_INPUT,
        422
      );
    }

    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens > AI_MAX_ESTIMATED_INPUT_TOKENS) {
      throw new AIError(
        `Ước lượng Token cho ${featureName} quá lớn (~${estimatedTokens} tokens). Vượt giới hạn an toàn ${AI_MAX_ESTIMATED_INPUT_TOKENS} tokens.`,
        AIErrorCode.AI_INVALID_INPUT,
        422
      );
    }
  }

  /**
   * Validate text specifically for grading answer
   */
  static validateGradingBudget(text, fieldName = "Bài làm") {
    const chars = text ? text.length : 0;
    if (chars > AI_MAX_GRADING_ANSWER_CHARS) {
      throw new AIError(
        `${fieldName} quá dài (${chars} ký tự). Giới hạn cho phép là ${AI_MAX_GRADING_ANSWER_CHARS} ký tự.`,
        AIErrorCode.AI_INVALID_INPUT,
        422
      );
    }
  }
}
