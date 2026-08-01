// Đọc thông tin lỗi từ phản hồi API, an toàn về kiểu.
//
// VÌ SAO CẦN
//
// 42 khối catch trong repo khai báo `catch (err: any)` chỉ để đọc được
// `err.response?.data?.message`. `any` ở đó tắt hoàn toàn việc kiểm kiểu: gõ nhầm
// `err.reponse` cũng biên dịch được, và trả về undefined lúc chạy.
//
// Đổi thẳng sang `unknown` sẽ làm vỡ 42 chỗ đó, nên trước hết phải có một chỗ để hỏi. Hai
// hàm dưới đây nhận `unknown` và tự thu hẹp kiểu — nơi gọi không cần biết hình dạng của lỗi
// axios, và không cần lặp lại chuỗi optional-chaining dài.
//
// Cũng gom về một chỗ một quy tắc vốn đang rải rác: ƯU TIÊN thông điệp máy chủ gửi, chỉ dùng
// câu mặc định khi không có. Trước đây mỗi nơi tự viết lại, và một vài nơi viết ngược.

/** Hình dạng lỗi mà axios ném ra khi máy chủ trả mã lỗi. */
interface ApiErrorShape {
  response?: {
    status?: number;
    data?: { message?: string; code?: string; errorCode?: string };
  };
  message?: string;
}

const asApiError = (error: unknown): ApiErrorShape =>
  error && typeof error === "object" ? (error as ApiErrorShape) : {};

/**
 * Thông điệp hiển thị cho người dùng.
 *
 * Đưa `fallback` thành tham số BẮT BUỘC là có chủ đích: mỗi màn hình cần một câu nói đúng ngữ
 * cảnh của nó ("Không thể tải bảng điểm" khác "Nộp bài thất bại"). Một câu mặc định chung cho
 * cả ứng dụng thì vô nghĩa với người đọc.
 *
 * KHÔNG DÙNG error.message KHI LỖI ĐẾN TỪ MÁY CHỦ.
 *
 * Bản đầu của hàm này xếp thứ tự "máy chủ -> error.message -> mặc định", và một test đã bắt
 * được là sai: axios luôn tự gắn `message` kiểu "Request failed with status code 500". Nếu máy
 * chủ không kèm thông điệp riêng, chuỗi tiếng Anh đó sẽ được hiển thị cho người dùng Việt —
 * tệ hơn hẳn câu mặc định của màn hình.
 *
 * Nên: có `response` thì chỉ tin thông điệp trong `response.data`, không có thì mới dùng
 * `error.message` (lúc đó nó là lỗi mạng thật, ví dụ "Network Error").
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const api = asApiError(error);
  if (api.response) return api.response.data?.message || fallback;
  return api.message || fallback;
};

/** Mã HTTP của lỗi, hoặc undefined nếu lỗi không đến từ phản hồi máy chủ (mất mạng, huỷ...). */
export const getApiErrorStatus = (error: unknown): number | undefined =>
  asApiError(error).response?.status;

/**
 * Mã lỗi NGHIỆP VỤ do backend trả (ASSIGNMENT_PAST_DEADLINE, AI_QUOTA_EXCEEDED...).
 *
 * Ưu tiên trường `errorCode` — nó LUÔN là chuỗi thuộc danh mục ở
 * Backend/src/shared/errors/errorCodes.js. Trường `code` cũ vẫn đọc làm phương án dự phòng
 * cho các endpoint chưa gắn mã, nhưng nó bị nhiễm: với lỗi MongoDB, code là một SỐ (11000).
 *
 * VÌ SAO NÊN DÙNG THAY CHO getApiErrorStatus: mã HTTP không phân biệt được nguyên nhân. Cùng
 * là 429 nhưng hết hạn mức NGÀY (phải đợi sang mai) khác hẳn bị chặn tần suất (đợi vài giây),
 * và người dùng cần được nói đúng.
 */
export const getApiErrorCode = (error: unknown): string | undefined => {
  const data = asApiError(error).response?.data;
  const code = data?.errorCode ?? data?.code;
  return typeof code === "string" ? code : undefined;
};
