/**
 * Bảng mã lỗi chuẩn hóa (Error Codes) cho Live Session Module
 */
export const LIVE_ERROR_CODES = {
  ADMIN_OPERATION_NOT_ALLOWED: "LIVE_ADMIN_OPERATION_NOT_ALLOWED",
  TEACHER_NOT_OWNER: "LIVE_TEACHER_NOT_OWNER",
  STUDENT_NOT_ENROLLED: "LIVE_STUDENT_NOT_ENROLLED",
  CLASS_NOT_FOUND: "LIVE_CLASS_NOT_FOUND",
  SESSION_NOT_FOUND: "LIVE_SESSION_NOT_FOUND",
  SESSION_ALREADY_ACTIVE: "LIVE_SESSION_ALREADY_ACTIVE",
  SESSION_NOT_ACTIVE: "LIVE_SESSION_NOT_ACTIVE",
  SESSION_ALREADY_ENDED: "LIVE_SESSION_ALREADY_ENDED",
  INVALID_TRANSITION: "LIVE_INVALID_TRANSITION",
  JAAS_UNAVAILABLE: "LIVE_JAAS_UNAVAILABLE",
  INVALID_CLASS_ID: "LIVE_INVALID_CLASS_ID",
  INVALID_SESSION_ID: "LIVE_INVALID_SESSION_ID",
};

/**
 * Class Custom Application Error
 */
export class LiveError extends Error {
  constructor(message, statusCode = 400, code = "LIVE_ERROR", details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Utility helper tạo Response Lỗi chuẩn REST API
 */
export const sendLiveError = (res, statusCode, code, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
    details,
  });
};
