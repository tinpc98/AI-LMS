import { AIError, AIErrorCode } from "../utils/aiError.js";

const rateLimitCache = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

/**
 * Middleware giới hạn số lượng request generate summary
 */
export const aiSummaryRateLimit = (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const now = Date.now();

  if (!rateLimitCache.has(userId)) {
    rateLimitCache.set(userId, { count: 1, firstRequest: now });
    return next();
  }

  const record = rateLimitCache.get(userId);

  if (now - record.firstRequest > WINDOW_MS) {
    // Reset window
    rateLimitCache.set(userId, { count: 1, firstRequest: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      code: AIErrorCode.AI_RATE_LIMIT_EXCEEDED,
      message: "Bạn đã gửi quá nhiều yêu cầu tạo tóm tắt. Vui lòng thử lại sau.",
    });
  }

  record.count += 1;
  next();
};
