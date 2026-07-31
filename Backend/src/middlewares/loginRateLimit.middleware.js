import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";

/**
 * Middleware chống dò mật khẩu (brute-force) trên endpoint đăng nhập.
 * Giới hạn theo IP vì request đăng nhập chưa có req.user.
 */
export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  code: "LOGIN_RATE_LIMIT_EXCEEDED",
  message: "Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
});
