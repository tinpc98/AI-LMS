// Chốt việc đọc id người dùng từ JWT.
//
// Đoạn này trước đây bị chép ở ba nơi và chưa từng có test. Nó chạy trên MỌI trang cần biết
// "tôi là ai", và mọi nhánh lỗi đều bị nuốt bằng `catch { return null }` — nghĩa là hỏng thì
// im lặng trả null, người dùng chỉ thấy dữ liệu trống chứ không thấy lỗi. Càng cần test.
import { describe, it, expect, beforeEach } from "vitest";
import { decodeJwtPayload, getCurrentUserId } from "../src/shared/utils/authToken";

/** Dựng một JWT hợp lệ về mặt định dạng (không ký thật — hàm này không kiểm chữ ký). */
const makeToken = (payload: Record<string, unknown>): string => {
  const base64url = (obj: unknown) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${base64url({ alg: "HS256" })}.${base64url(payload)}.chu-ky-gia`;
};

beforeEach(() => localStorage.clear());

describe("decodeJwtPayload", () => {
  it("đọc được payload thường", () => {
    expect(decodeJwtPayload(makeToken({ _id: "u1", role: "Student" }))).toMatchObject({
      _id: "u1",
    });
  });

  it("giữ nguyên tiếng Việt có dấu", () => {
    // atob chỉ trả về latin-1. Thiếu bước decodeURIComponent thì "Nguyễn" thành ký tự rác.
    // Đây là lý do đoạn mã gốc dài dòng như vậy, chốt lại để không ai "dọn gọn" nó đi.
    const payload = decodeJwtPayload(makeToken({ _id: "u1", fullName: "Nguyễn Văn Đức" }));
    expect((payload as { fullName?: string })?.fullName).toBe("Nguyễn Văn Đức");
  });

  it("trả null khi token sai định dạng, không ném lỗi", () => {
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("khong-phai-jwt")).toBeNull();
    expect(decodeJwtPayload("a.b")).toBeNull(); // phần payload không phải base64 hợp lệ
    expect(decodeJwtPayload("a..c")).toBeNull(); // payload rỗng
  });
});

describe("getCurrentUserId", () => {
  it("trả null khi chưa đăng nhập", () => {
    expect(getCurrentUserId()).toBeNull();
  });

  it.each([["_id"], ["id"], ["userId"]])(
    "chấp nhận trường tên %s — máy chủ từng đặt cả ba cách",
    (field) => {
      localStorage.setItem("accessToken", makeToken({ [field]: "u-123" }));
      expect(getCurrentUserId()).toBe("u-123");
    }
  );

  it("ưu tiên _id khi có nhiều trường cùng lúc", () => {
    localStorage.setItem("accessToken", makeToken({ _id: "a", id: "b", userId: "c" }));
    expect(getCurrentUserId()).toBe("a");
  });

  it("trả NULL chứ không phải undefined khi payload không có id nào", () => {
    // Đúng chỗ ba bản chép tay lệch nhau: `a || b || c` cho ra undefined, trong khi chữ ký
    // khai báo string | null. Nơi gọi kiểm bằng `=== null` sẽ trượt.
    localStorage.setItem("accessToken", makeToken({ role: "Student" }));
    expect(getCurrentUserId()).toBeNull();
  });

  it("token hỏng thì trả null, không làm sập trang", () => {
    localStorage.setItem("accessToken", "token-rac");
    expect(getCurrentUserId()).toBeNull();
  });
});
