// Danh mục mã lỗi nghiệp vụ — hợp đồng giữa Backend và Frontend.
//
// VẤN ĐỀ NÓ GIẢI QUYẾT
//
// Frontend đang phải ĐOÁN nguyên nhân lỗi từ mã HTTP. Ví dụ có thật trong useAIChat:
//
//     if (status === 400) "Không thể mở trợ lý AI trong nội dung hiện tại."
//     else if (status === 403) "Bạn không có quyền sử dụng trợ lý AI tại đây."
//     else if (status === 429) "Bạn đã sử dụng hết lượt AI hiện tại."
//
// Nhưng 400 có thể là thiếu tham số, sai định dạng id, hay tính năng bị tắt; 429 có thể là hết
// hạn mức ngày HOẶC bị chặn tần suất. Frontend hiển thị sai nguyên nhân, và không có cách nào
// biết là đang sai.
//
// VÌ SAO LÀ TRƯỜNG RIÊNG `errorCode`, KHÔNG DÙNG LẠI `code`
//
// errorHandler đã có trường `code`, nhưng nó bị nhiễm: `err.code` của lỗi MongoDB là một SỐ
// (11000 cho trùng khoá). Một trường lúc là chuỗi lúc là số thì Frontend không thể so sánh
// chắc chắn. `errorCode` LUÔN là chuỗi thuộc danh mục dưới đây.
//
// LỘ TRÌNH HAI GIAI ĐOẠN (theo quyết định đã thống nhất)
//
//   Giai đoạn 1 (commit này): thêm errorCode, GIỮ NGUYÊN mã HTTP cũ. Thuần bổ sung, không
//                             client nào vỡ.
//   Giai đoạn 2 (sau khi Frontend chuyển hết sang đọc errorCode): mới sửa mã HTTP cho đúng
//                             bản chất ở tầng service.
//
// QUY ƯỚC ĐẶT TÊN: <MIỀN>_<SỰ_VIỆC>, chữ hoa, gạch dưới. Mô tả ĐIỀU ĐÃ XẢY RA, không mô tả
// cách xử lý — "EXAM_SET_LOCKED" chứ không phải "SHOW_LOCK_DIALOG".

export const ErrorCode = {
  // ── Chung ────────────────────────────────────────────────────────────────
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_ID: "INVALID_ID",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  DUPLICATE_KEY: "DUPLICATE_KEY",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // ── Bài tập ──────────────────────────────────────────────────────────────
  ASSIGNMENT_NOT_FOUND: "ASSIGNMENT_NOT_FOUND",
  /** Quá hạn nộp — hệ thống từ chối tạo bài nộp (chính sách 2A). */
  ASSIGNMENT_PAST_DEADLINE: "ASSIGNMENT_PAST_DEADLINE",
  /** Đã chấm điểm thì không nộp lại được. Khác hẳn quá hạn, dù cùng là "không nộp được". */
  SUBMISSION_ALREADY_GRADED: "SUBMISSION_ALREADY_GRADED",
  SUBMISSION_NOT_FOUND: "SUBMISSION_NOT_FOUND",

  // ── Thi cử ───────────────────────────────────────────────────────────────
  EXAM_NOT_FOUND: "EXAM_NOT_FOUND",
  EXAM_NOT_STARTED: "EXAM_NOT_STARTED",
  EXAM_CLOSED: "EXAM_CLOSED",
  ATTEMPT_NOT_FOUND: "ATTEMPT_NOT_FOUND",
  /** Đã nộp hoặc đã chốt điểm — không thao tác thêm được. */
  ATTEMPT_ALREADY_FINISHED: "ATTEMPT_ALREADY_FINISHED",
  /** Hết giờ làm bài, máy chủ không nhận thêm câu trả lời. */
  ATTEMPT_TIME_OVER: "ATTEMPT_TIME_OVER",
  NOT_ENROLLED_IN_CLASS: "NOT_ENROLLED_IN_CLASS",

  // ── Bộ đề ────────────────────────────────────────────────────────────────
  EXAM_SET_NOT_FOUND: "EXAM_SET_NOT_FOUND",
  EXAM_SET_LOCKED: "EXAM_SET_LOCKED",
  EXAM_SET_ACCESS_DENIED: "EXAM_SET_ACCESS_DENIED",

  // ── AI ───────────────────────────────────────────────────────────────────
  /** Hết hạn mức trong NGÀY. Cùng 429 với AI_RATE_LIMITED nhưng cách xử lý khác hẳn:
   *  cái này phải đợi sang ngày, cái kia chỉ cần đợi vài giây. */
  AI_QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_FEATURE_DISABLED: "AI_FEATURE_DISABLED",

  // ── Lớp học ──────────────────────────────────────────────────────────────
  CLASS_NOT_FOUND: "CLASS_NOT_FOUND",
  CLASS_ACCESS_DENIED: "CLASS_ACCESS_DENIED",
};

/**
 * Tạo lỗi nghiệp vụ kèm mã HTTP và mã lỗi.
 *
 * `errorCode` là tuỳ chọn để không phải sửa hết mọi lời gọi cũ cùng lúc — đó chính là tinh
 * thần "hai giai đoạn". Lỗi chưa gắn mã vẫn chạy như trước.
 */
export const createError = (message, status, errorCode) => {
  const error = new Error(message);
  error.status = status;
  if (errorCode) error.errorCode = errorCode;
  return error;
};

export default ErrorCode;
