// File: src/utils/appError.js
// Hệ thống Error class dùng chung cho toàn backend, theo cùng khuôn mẫu đã có sẵn
// ở src/utils/aiError.js (message, code, status, details) để không tạo thêm 1 quy ước
// khác biệt trong cùng codebase.

export class AppError extends Error {
  /**
   * @param {string} message - Thông báo lỗi.
   * @param {string} code - Mã lỗi dạng chuỗi (SCREAMING_SNAKE_CASE), dùng cho client phân biệt loại lỗi.
   * @param {number} status - HTTP status code tương ứng.
   * @param {Object} [details=null] - Thông tin bổ sung (vd. danh sách field lỗi validation).
   */
  constructor(message, code = "INTERNAL_ERROR", status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.isAppError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.", details = null) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Bạn chưa đăng nhập hoặc không có thông tin xác thực!") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện hành động này.") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy tài nguyên yêu cầu.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Dữ liệu bị xung đột, vui lòng thử lại.", details = null) {
    super(message, "CONFLICT", 409, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message = "Yêu cầu vi phạm quy tắc nghiệp vụ.", details = null) {
    super(message, "BUSINESS_RULE_VIOLATION", 422, details);
  }
}
