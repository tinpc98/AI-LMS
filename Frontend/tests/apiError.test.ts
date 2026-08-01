// Chốt cách đọc lỗi API.
//
// Ba hàm này thay cho 42 khối `catch (err: any)` rải khắp repo. Chúng chạy ở MỌI nhánh lỗi của
// ứng dụng, nên một lỗi ở đây hiện ra dưới dạng "thông báo lỗi sai" trên hàng chục màn hình.
//
// Chúng nhận `unknown` chứ không phải `any` — nghĩa là phải chịu được bất kỳ thứ gì bị ném ra,
// kể cả những thứ không phải Error.
import { describe, it, expect } from "vitest";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "../src/shared/utils/apiError";

const loiAxios = (status: number, message?: string, code?: string) => ({
  response: { status, data: { message, code } },
  message: "Request failed",
});

describe("getApiErrorMessage", () => {
  it("ƯU TIÊN thông điệp máy chủ gửi", () => {
    // Máy chủ biết chuyện gì xảy ra; câu mặc định của màn hình chỉ là phương án cuối.
    expect(getApiErrorMessage(loiAxios(400, "Email đã tồn tại"), "Lỗi mặc định")).toBe(
      "Email đã tồn tại"
    );
  });

  it("không có thông điệp máy chủ thì dùng message của Error", () => {
    expect(getApiErrorMessage(new Error("Mất kết nối"), "Lỗi mặc định")).toBe("Mất kết nối");
  });

  it("không có gì thì dùng câu mặc định của màn hình", () => {
    expect(getApiErrorMessage({}, "Không thể tải bảng điểm")).toBe("Không thể tải bảng điểm");
  });

  it("thông điệp máy chủ RỖNG cũng rơi về mặc định, không hiện chuỗi trống", () => {
    // Chuỗi rỗng là falsy nên phải rơi xuống nhánh sau — nếu không, người dùng thấy một hộp
    // thông báo trắng trơn và không hiểu chuyện gì.
    expect(getApiErrorMessage(loiAxios(500, ""), "Đã có lỗi")).toBe("Đã có lỗi");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["chuỗi", "một lỗi dạng chuỗi"],
    ["số", 500],
    ["mảng", []],
  ])("chịu được thứ bị ném ra là %s", (_ten, giaTri) => {
    // Không phải thứ gì bị throw cũng là Error. Ném lỗi ở ĐÂY sẽ che mất lỗi gốc.
    expect(getApiErrorMessage(giaTri, "mặc định")).toBe("mặc định");
  });
});

describe("getApiErrorStatus", () => {
  it("trả mã HTTP khi lỗi đến từ phản hồi máy chủ", () => {
    expect(getApiErrorStatus(loiAxios(404))).toBe(404);
  });

  it("trả undefined khi KHÔNG phải lỗi từ máy chủ", () => {
    // Mất mạng hoặc request bị huỷ thì không có response. Phân biệt được điều này quan trọng:
    // "chưa nộp bài" (404) khác hẳn "không gọi được máy chủ".
    expect(getApiErrorStatus(new Error("Network Error"))).toBeUndefined();
    expect(getApiErrorStatus(null)).toBeUndefined();
  });

  it("giữ nguyên số 0 nếu có, không nhầm thành undefined", () => {
    expect(getApiErrorStatus({ response: { status: 0 } })).toBe(0);
  });
});

describe("getApiErrorCode", () => {
  it("đọc mã lỗi dạng chữ do backend trả", () => {
    expect(getApiErrorCode(loiAxios(409, "Trùng", "DUPLICATE_KEY"))).toBe("DUPLICATE_KEY");
  });

  it("không có thì trả undefined", () => {
    expect(getApiErrorCode(new Error("x"))).toBeUndefined();
  });
});

describe("getApiErrorMessage — KHÔNG hiện thông điệp nội bộ của axios", () => {
  it("máy chủ trả lỗi nhưng không kèm thông điệp -> dùng câu của màn hình", () => {
    // axios luôn tự gắn message kiểu "Request failed with status code 500". Hiện chuỗi tiếng
    // Anh đó cho người dùng Việt thì tệ hơn hẳn một câu mặc định viết đúng ngữ cảnh.
    const loi = {
      response: { status: 500, data: {} },
      message: "Request failed with status code 500",
    };

    expect(getApiErrorMessage(loi, "Không thể tải bảng điểm")).toBe("Không thể tải bảng điểm");
  });

  it("lỗi MẠNG (không có response) thì vẫn dùng error.message", () => {
    // Ở đây message là thông tin thật và hữu ích, khác với trường hợp trên.
    expect(getApiErrorMessage(new Error("Network Error"), "mặc định")).toBe("Network Error");
  });
});

describe("getApiErrorCode — mã lỗi nghiệp vụ", () => {
  it("ưu tiên trường errorCode mới", () => {
    const loi = {
      response: { status: 429, data: { errorCode: "AI_QUOTA_EXCEEDED", code: "INTERNAL_ERROR" } },
    };
    expect(getApiErrorCode(loi)).toBe("AI_QUOTA_EXCEEDED");
  });

  it("chưa có errorCode thì dùng code cũ — endpoint chưa chuyển vẫn chạy", () => {
    // Đây là điều kiện để chuyển đổi hai giai đoạn.
    expect(getApiErrorCode({ response: { data: { code: "VALIDATION_ERROR" } } })).toBe(
      "VALIDATION_ERROR"
    );
  });

  it("BỎ QUA mã số của MongoDB, không trả về 11000", () => {
    // Chính lý do phải tách khỏi trường `code`. Trả về số sẽ khiến mọi phép so sánh chuỗi ở
    // nơi gọi âm thầm sai.
    expect(getApiErrorCode({ response: { data: { code: 11000 } } })).toBeUndefined();
  });

  it("không phải lỗi từ máy chủ thì trả undefined", () => {
    expect(getApiErrorCode(new Error("Network Error"))).toBeUndefined();
    expect(getApiErrorCode(null)).toBeUndefined();
  });
});
