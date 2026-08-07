// File: src/shared/middlewares/errorHandler.middleware.js
// Global error handler tập trung — thay thế handler rải rác/không nhất quán trong main.js.
// Tôn trọng err.status/err.code khi lỗi được ném từ AppError (hoặc AIError, hoặc bất kỳ
// Error nào có sẵn field .status như nhiều service hiện tại đã tự quy ước).

const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Quy đổi lỗi do Mongoose/MongoDB ném ra thành mã HTTP đúng bản chất.
 *
 * VÌ SAO ĐẶT Ở ĐÂY (Wave 4.4): trước đó chỉ 2/25 controller tự làm việc này bằng đoạn
 *     const isValidationError = error.name === "ValidationError";
 *     res.status(isValidationError ? 400 : 500)
 * 23 controller còn lại KHÔNG kiểm, nên khi dữ liệu gửi lên sai schema chúng trả 500 —
 * báo "lỗi máy chủ" cho một lỗi hoàn toàn do phía client.
 *
 * Gom về một chỗ vừa giữ nguyên hành vi đúng của 2 controller kia, vừa sửa luôn cho 23
 * controller còn lại, và các endpoint viết sau này được đúng mặc định.
 *
 * @returns {{status:number, code:string, details:any}|null} null nếu không phải lỗi Mongo.
 */
const mapMongooseError = (err) => {
  // Sai schema: thiếu trường bắt buộc, sai enum, vượt min/max...
  if (err.name === "ValidationError" && err.errors) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      details: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    };
  }

  // Ép kiểu thất bại — hay gặp nhất là ObjectId không hợp lệ trên URL param.
  if (err.name === "CastError") {
    return {
      status: 400,
      code: "INVALID_ID",
      details: [{ field: err.path, message: `Giá trị "${err.value}" không hợp lệ` }],
    };
  }

  // Vi phạm unique index. 409 chứ không phải 400: dữ liệu gửi lên hợp lệ, chỉ là xung đột
  // với dữ liệu đã có.
  if (err.code === 11000) {
    return {
      status: 409,
      code: "DUPLICATE_KEY",
      details: Object.keys(err.keyPattern || {}).map((field) => ({
        field,
        message: `Giá trị của "${field}" đã tồn tại`,
      })),
    };
  }

  return null;
};

export const errorHandler = (err, req, res, next) => {
  const mongo = mapMongooseError(err);
  const status = err.status || err.statusCode || mongo?.status || 500;
  // Với lỗi 500 không xác định (không phải AppError cố ý ném ra), không lộ message nội bộ
  // ra client ở production — tránh rò rỉ chi tiết triển khai (đường dẫn file, tên thư viện,...).
  const isUnexpected = status === 500 && !err.isAppError && !err.isAIError;
  const message =
    isUnexpected && isProduction()
      ? "Đã xảy ra lỗi nội bộ trên Server!"
      : err.message || "Đã xảy ra lỗi nội bộ trên Server!";

  console.error(
    `🔥 [${req.requestId || "no-request-id"}] ${req.method} ${req.originalUrl} → ${status}:`,
    isUnexpected ? err.stack : err.message
  );

  const body = {
    success: false,
    message,
    // err.code của MongoDB là số (vd 11000) — dùng mã chữ đã quy đổi cho client dễ xử lý.
    code: mongo?.code || err.code || "INTERNAL_ERROR",
    // Mã lỗi nghiệp vụ, LUÔN là chuỗi thuộc danh mục shared/errors/errorCodes.js.
    //
    // Tách khỏi `code` vì trường đó bị nhiễm: với lỗi MongoDB, err.code là một SỐ (11000). Một
    // trường lúc chuỗi lúc số thì Frontend không so sánh chắc chắn được.
    //
    // Mục đích: Frontend thôi phải ĐOÁN nguyên nhân từ mã HTTP. Cùng là 429 nhưng hết hạn mức
    // ngày (phải đợi sang mai) khác hẳn bị chặn tần suất (đợi vài giây) — mã HTTP không phân
    // biệt được, errorCode thì có.
    //
    // Giai đoạn 1: chỉ THÊM trường này, mã HTTP giữ nguyên. Không client nào vỡ.
    // Thứ tự: errorCode tường minh > mã đã quy đổi từ Mongoose > err.code NẾU là chuỗi.
    //
    // Nhánh cuối cho AIError dùng lại được kho mã sẵn có của nó (AI_QUOTA_EXCEEDED,
    // AI_RATE_LIMIT_EXCEEDED...) mà không phải khai báo lại. Điều kiện "là chuỗi" chính là chỗ
    // loại bỏ mã số của MongoDB.
    errorCode:
      err.errorCode ||
      mongo?.code ||
      (typeof err.code === "string" ? err.code : null) ||
      "INTERNAL_ERROR",
    requestId: req.requestId || null,
  };

  if (status === 500) {
    console.error("=== LỖI 500 GỐC TỪ SERVER ===");
    console.error(err.stack || err);
    console.error("===============================");
  }

  if (!isProduction() && err.stack) body.stack = err.stack;
  res.status(status).json(body);
};

// 404 cho các route không khớp router nào — tách riêng khỏi errorHandler (không phải lỗi runtime).
export const notFoundHandler = (req, res) => {
  console.error(`🔥 [${req.requestId || "no-request-id"}] 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Không thực hiện được thao tác. Vui lòng thử lại hoặc liên hệ quản trị viên.",
    code: "ROUTE_NOT_FOUND",
    requestId: req.requestId || null,
  });
};
