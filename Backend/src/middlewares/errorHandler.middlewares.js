// File: src/middlewares/errorHandler.middlewares.js
// Global error handler tập trung — thay thế handler rải rác/không nhất quán trong main.js.
// Tôn trọng err.status/err.code khi lỗi được ném từ AppError (hoặc AIError, hoặc bất kỳ
// Error nào có sẵn field .status như nhiều service hiện tại đã tự quy ước).

const isProduction = () => process.env.NODE_ENV === "production";

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  // Với lỗi 500 không xác định (không phải AppError cố ý ném ra), không lộ message nội bộ
  // ra client ở production — tránh rò rỉ chi tiết triển khai (đường dẫn file, tên thư viện,...).
  const isUnexpected = status === 500 && !err.isAppError && !err.isAIError;
  const message = isUnexpected && isProduction()
    ? "Đã xảy ra lỗi nội bộ trên Server!"
    : err.message || "Đã xảy ra lỗi nội bộ trên Server!";

  console.error(
    `🔥 [${req.requestId || "no-request-id"}] ${req.method} ${req.originalUrl} → ${status}:`,
    isUnexpected ? err.stack : err.message
  );

  const body = {
    success: false,
    message,
    code: err.code || "INTERNAL_ERROR",
    requestId: req.requestId || null,
  };

  if (err.details) body.details = err.details;
  if (!isProduction() && err.stack) body.stack = err.stack;

  res.status(status).json(body);
};

// 404 cho các route không khớp router nào — tách riêng khỏi errorHandler (không phải lỗi runtime).
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Đường dẫn API này không tồn tại trên hệ thống!",
    code: "ROUTE_NOT_FOUND",
    requestId: req.requestId || null,
  });
};
