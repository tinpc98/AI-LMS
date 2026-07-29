/**
 * Standardized Error Codes for AI Module
 */
export const AIErrorCode = {
  AI_FEATURE_DISABLED: "AI_FEATURE_DISABLED",
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
  AI_RATE_LIMIT_EXCEEDED: "AI_RATE_LIMIT_EXCEEDED",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_OUTPUT_INVALID: "AI_OUTPUT_INVALID",
  AI_INVALID_INPUT: "AI_INVALID_INPUT",
  AI_CONFIG_ERROR: "AI_CONFIG_ERROR",
};

/**
 * Standardized AIError class
 */
export class AIError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - AIErrorCode enum value
   * @param {number} status - HTTP status code (e.g. 400, 429, 502, 504)
   * @param {Object} [details=null] - Additional context/metadata
   */
  constructor(message, code = AIErrorCode.AI_PROVIDER_ERROR, status = 500, details = null) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.isAIError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AIError;
