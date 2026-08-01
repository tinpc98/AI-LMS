// Đọc id người dùng từ access token trong localStorage.
//
// Đoạn giải mã này trước đây bị chép nguyên văn ở BA nơi: useClassDetail, ClassDetail.tsx và
// useExamDetail. Ba bản gần như y hệt nhưng lệch nhau ở kiểu trả về — hai bản kết thúc bằng
// `a || b || c` nên trả về undefined khi thiếu cả ba trường, trong khi chữ ký khai báo là
// `string | null`. TypeScript không bắt được vì payload đã bị ép về any.
//
// CẢNH BÁO: đây chỉ là ĐỌC, không phải XÁC THỰC. Payload JWT ai cũng đọc và sửa được; chỉ có
// máy chủ kiểm chữ ký mới biết token thật hay giả. Dùng giá trị này để hiển thị hoặc để gọi
// API, TUYỆT ĐỐI không dùng để quyết định quyền.

interface JwtPayload {
  _id?: string;
  id?: string;
  userId?: string;
}

/**
 * Giải mã phần payload của JWT. Trả về null nếu token sai định dạng — token hỏng là chuyện
 * bình thường (hết hạn, bị sửa, localStorage bị ghi bậy), không phải sự cố cần ném lỗi.
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // base64url -> base64 tiêu chuẩn, rồi khôi phục UTF-8 (atob chỉ trả về latin-1, nên tên
    // có dấu tiếng Việt sẽ vỡ nếu bỏ bước decodeURIComponent này).
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Id của người dùng đang đăng nhập, hoặc null nếu chưa đăng nhập / token hỏng.
 *
 * Máy chủ từng đặt tên trường này theo ba cách khác nhau nên phải thử lần lượt.
 */
export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  return payload?._id || payload?.id || payload?.userId || null;
};
