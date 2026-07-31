import { AIErrorCode } from "../utils/aiError.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";

/**
 * Middleware giới hạn số lượng request generate summary (5 request/phút/user).
 */
export const aiSummaryRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user.id || req.user._id,
  code: AIErrorCode.AI_RATE_LIMIT_EXCEEDED,
  message: "Bạn đã gửi quá nhiều yêu cầu tạo tóm tắt. Vui lòng thử lại sau.",
});
