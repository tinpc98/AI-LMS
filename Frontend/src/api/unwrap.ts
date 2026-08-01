// Gỡ vỏ phản hồi API, có kiểu.
//
// VẤN ĐỀ NÓ THAY THẾ
//
// 13 chỗ trong repo viết `(response.data as any).data ?? response.data`. Ý định là "nếu có
// envelope thì lấy trong, không thì lấy chính nó" — nhưng `as any` tắt kiểm kiểu ở đúng chỗ
// dữ liệu từ mạng đi vào ứng dụng, tức là chỗ đáng kiểm nhất.
//
// ĐỌC BACKEND MỚI THẤY NHÁNH PHÒNG HỜ ẤY LÀ THỪA
//
// shared/utils/response.js dựng phản hồi bằng sendSuccess, và nó LUÔN bọc:
//     { success: true, message, data }
// Không có endpoint nào dùng helper đó mà trả dữ liệu trần. Nhánh `?? response.data` vì thế
// chưa từng chạy — nhưng nó khiến người đọc tưởng hình dạng phản hồi là không chắc chắn.
//
// CÓ MỘT TRƯỜNG HỢP THẬT, VÀ NÓ KHÁC VỚI ĐIỀU MỌI NGƯỜI NGHĨ
//
// sendSuccess BỎ HẲN trường `data` khi giá trị là null (`...(data !== null && { data })`).
// Nên `data` vắng mặt nghĩa là "máy chủ trả về null", chứ không phải "phản hồi không có
// envelope". Nhánh phòng hờ cũ xử lý sai đúng chỗ này: nó trả về NGUYÊN CẢ ENVELOPE
// ({ success, message }) như thể đó là dữ liệu.

/** Envelope chuẩn. `data` là tuỳ chọn vì backend bỏ trường này khi giá trị là null. */
export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

/**
 * Lấy phần dữ liệu, hoặc `fallback` khi máy chủ không trả gì.
 *
 * Bắt buộc truyền `fallback` để nơi gọi phải quyết định "không có dữ liệu thì là gì" — mảng
 * rỗng, null, hay object mặc định. Trước đây mỗi chỗ tự chắp vá bằng `?? []` hoặc `|| {}`
 * rải rác, và vài chỗ quên hẳn.
 */
export const unwrap = <T>(envelope: ApiEnvelope<T>, fallback: T): T => envelope.data ?? fallback;

/** Dùng khi vắng dữ liệu là trạng thái hợp lệ và nơi gọi tự xử lý null. */
export const unwrapOrNull = <T>(envelope: ApiEnvelope<T>): T | null => envelope.data ?? null;
