// File: src/middlewares/rateLimit.middlewares.js
// Factory tạo middleware giới hạn tần suất request theo cửa sổ thời gian cố định (fixed window),
// lưu trạng thái trong bộ nhớ tiến trình (in-memory). Phù hợp cho triển khai 1 instance.

/**
 * @param {Object} options
 * @param {number} options.windowMs - Độ dài cửa sổ tính giới hạn (ms).
 * @param {number} options.max - Số request tối đa cho phép trong 1 cửa sổ.
 * @param {(req: import("express").Request) => string} options.keyGenerator - Hàm sinh khóa định danh (userId, IP,...).
 * @param {string} options.code - Mã lỗi trả về khi vượt hạn mức.
 * @param {string} options.message - Thông báo lỗi trả về khi vượt hạn mức.
 */
export const createRateLimiter = ({ windowMs, max, keyGenerator, code = "RATE_LIMIT_EXCEEDED", message }) => {
  const hits = new Map();

  // Dọn dẹp định kỳ các entry đã hết hạn để tránh rò rỉ bộ nhớ.
  // unref() để không giữ tiến trình Node sống chỉ vì timer này (không cản graceful shutdown).
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits) {
      if (now - record.firstRequest > windowMs) hits.delete(key);
    }
  }, windowMs).unref();

  const middleware = (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    const record = hits.get(key);
    if (!record || now - record.firstRequest > windowMs) {
      hits.set(key, { count: 1, firstRequest: now });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        code,
        message,
      });
    }

    record.count += 1;
    next();
  };

  middleware._sweeper = sweeper; // Tham chiếu phục vụ dọn dẹp trong test, không dùng ở runtime.
  return middleware;
};
