import type { LiveSessionError, MediaErrorCode } from "../types/liveSession";

/**
 * Chuẩn hóa mọi error (Axios/Network/Runtime) thành LiveSessionError contract
 */
export function normalizeLiveSessionError(err: unknown): LiveSessionError {
  const errorObj = err as {
    code?: string;
    status?: number;
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string;
      };
    };
    message?: string;
  };

  const status = errorObj?.response?.status || errorObj?.status;
  const backendCode = errorObj?.response?.data?.code || errorObj?.code;
  const backendMsg = errorObj?.response?.data?.message || errorObj?.message;

  // 1. Mất kết nối mạng (Axios network error hoặc offline)
  if (!navigator.onLine || errorObj?.code === "ERR_NETWORK" || backendMsg?.includes("Network Error")) {
    return {
      code: "NETWORK_ERROR",
      title: "Mất kết nối mạng",
      message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối Internet của bạn.",
      retryable: true,
      severity: "warning",
      originalStatus: status,
    };
  }

  // 2. HTTP Status code mapping
  switch (status) {
    case 401:
      return {
        code: backendCode || "UNAUTHORIZED",
        title: "Phiên đăng nhập hết hạn",
        message: "Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.",
        retryable: false,
        severity: "error",
        originalStatus: 401,
      };
    case 403:
      return {
        code: backendCode || "FORBIDDEN",
        title: "Từ chối truy cập",
        message: "Bạn không có quyền tham gia buổi học trực tuyến này.",
        retryable: false,
        severity: "error",
        originalStatus: 403,
      };
    case 404:
      return {
        code: backendCode || "SESSION_NOT_FOUND",
        title: "Không tìm thấy phiên học",
        message: "Buổi học không tồn tại hoặc đã bị hủy.",
        retryable: false,
        severity: "warning",
        originalStatus: 404,
      };
    case 409:
      return {
        code: backendCode || "SESSION_ENDED",
        title: "Buổi học đã kết thúc",
        message: "Buổi học trực tuyến này đã kết thúc trước đó.",
        retryable: false,
        severity: "info",
        originalStatus: 409,
      };
    case 503:
      return {
        code: backendCode || "JAAS_UNAVAILABLE",
        title: "Hệ thống video chưa sẵn sàng",
        message: "Dịch vụ phòng học trực tuyến 8x8 JaaS tạm thời gián đoạn. Vui lòng thử lại sau.",
        retryable: true,
        severity: "warning",
        originalStatus: 503,
      };
    case 500:
    default:
      return {
        code: backendCode || "SERVER_ERROR",
        title: "Lỗi hệ thống",
        message: backendMsg || "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
        retryable: true,
        severity: "error",
        originalStatus: status || 500,
      };
  }
}

/**
 * Map lỗi browser WebRTC / Media devices sang thông điệp tiếng Việt thân thiện
 */
export function mapMediaError(err: unknown): { code: MediaErrorCode; message: string } {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return {
      code: "MEDIA_INSECURE_CONTEXT",
      message: "Camera và Microphone yêu cầu kết nối HTTPS an toàn để hoạt động.",
    };
  }

  const name = (err as { name?: string })?.name || "";
  const msg = (err as { message?: string })?.message || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("Permission denied")) {
    return {
      code: "MEDIA_PERMISSION_DENIED",
      message:
        "Trình duyệt đang chặn quyền Camera/Microphone. Vui lòng nhấn vào biểu tượng ổ khóa trên thanh địa chỉ trình duyệt, bật cho phép Camera & Microphone rồi thử lại.",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.includes("Requested device not found")) {
    return {
      code: "MEDIA_DEVICE_NOT_FOUND",
      message: "Không tìm thấy thiết bị Camera hoặc Microphone kết nối với máy tính.",
    };
  }

  if (name === "NotReadableError" || name === "TrackStartError" || msg.includes("Could not start video source")) {
    return {
      code: "MEDIA_DEVICE_BUSY",
      message: "Camera hoặc Microphone đang được sử dụng bởi một ứng dụng khác (Zoom, Teams,...).",
    };
  }

  if (name === "NotSupportedError" || !navigator?.mediaDevices) {
    return {
      code: "MEDIA_BROWSER_UNSUPPORTED",
      message: "Trình duyệt của bạn không hỗ trợ tính năng cuộc gọi video WebRTC.",
    };
  }

  return {
    code: "MEDIA_UNKNOWN_ERROR",
    message: "Khởi tạo thiết bị Camera/Microphone thất bại. Vui lòng kiểm tra cài đặt trình duyệt.",
  };
}
