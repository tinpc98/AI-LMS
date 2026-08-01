// Chốt hợp đồng errorCode giữa Backend và Frontend.
//
// Đây là thứ Frontend sẽ rẽ nhánh theo, thay cho việc đoán từ mã HTTP. Một mã bị đổi tên hoặc
// lọt kiểu số sẽ làm hỏng logic hiển thị ở nhiều màn hình cùng lúc, mà không có lỗi biên dịch
// nào cảnh báo.
import { describe, it, expect, vi } from "vitest";
import { ErrorCode, createError } from "#shared/errors/errorCodes.js";
import { errorHandler } from "#shared/middlewares/errorHandler.middleware.js";

const chayHandler = (err) => {
  const req = { method: "GET", originalUrl: "/api/test", requestId: "rq-1" };
  const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
  vi.spyOn(console, "error").mockImplementation(() => {});
  errorHandler(err, req, res, vi.fn());
  return { status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
};

describe("danh mục ErrorCode", () => {
  it("mọi mã đều là chuỗi và trùng với khoá của nó", () => {
    // Khoá lệch giá trị là cái bẫy im lặng: mã gửi đi khác mã lập trình viên đang đọc.
    for (const [key, value] of Object.entries(ErrorCode)) {
      expect(typeof value).toBe("string");
      expect(value).toBe(key);
    }
  });

  it("không có mã nào trùng nhau", () => {
    const values = Object.values(ErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  it("mã dùng CHỮ HOA và gạch dưới — quy ước để Frontend so sánh chắc chắn", () => {
    for (const value of Object.values(ErrorCode)) {
      expect(value).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});

describe("createError", () => {
  it("gắn đủ message, status và errorCode", () => {
    const err = createError("Quá hạn", 400, ErrorCode.ASSIGNMENT_PAST_DEADLINE);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Quá hạn");
    expect(err.status).toBe(400);
    expect(err.errorCode).toBe("ASSIGNMENT_PAST_DEADLINE");
  });

  it("KHÔNG gắn errorCode khi không truyền — lời gọi cũ vẫn chạy", () => {
    // Đây là điều kiện để chuyển đổi hai giai đoạn: không phải sửa hết mọi chỗ cùng lúc.
    const err = createError("Lỗi cũ", 500);
    expect(err.errorCode).toBeUndefined();
  });
});

describe("errorHandler — trường errorCode", () => {
  it("trả errorCode do service gắn", () => {
    const { status, body } = chayHandler(
      createError("Quá hạn nộp", 400, ErrorCode.ASSIGNMENT_PAST_DEADLINE)
    );

    expect(status).toBe(400);
    expect(body.errorCode).toBe("ASSIGNMENT_PAST_DEADLINE");
  });

  it("GIỮ NGUYÊN mã HTTP — giai đoạn 1 chỉ THÊM trường, không đổi status", () => {
    // Toàn bộ tính an toàn của lộ trình hai giai đoạn nằm ở tính chất này.
    for (const httpStatus of [400, 403, 404, 409, 429, 500]) {
      const { status } = chayHandler(createError("x", httpStatus, ErrorCode.NOT_FOUND));
      expect(status).toBe(httpStatus);
    }
  });

  it("lỗi CHƯA gắn mã vẫn có errorCode mặc định, không phải undefined", () => {
    // Frontend đọc body.errorCode ở mọi nhánh lỗi; trả undefined sẽ buộc nó phải kiểm tra
    // tồn tại ở khắp nơi.
    const { body } = chayHandler(new Error("lỗi chưa gắn mã"));
    expect(body.errorCode).toBe("INTERNAL_ERROR");
  });

  it("lỗi trùng khoá MongoDB: errorCode là CHUỖI, không phải số 11000", () => {
    // Chính lý do phải tách khỏi trường `code`. err.code của MongoDB là số; nếu để lọt, phép
    // so sánh chuỗi ở Frontend luôn sai mà không ai biết.
    const mongoErr = new Error("E11000 duplicate key");
    mongoErr.code = 11000;
    mongoErr.keyPattern = { email: 1 };

    const { status, body } = chayHandler(mongoErr);

    expect(status).toBe(409);
    expect(body.errorCode).toBe("DUPLICATE_KEY");
    expect(typeof body.errorCode).toBe("string");
  });

  it("ValidationError của Mongoose cho ra errorCode chuẩn", () => {
    const err = new Error("validation failed");
    err.name = "ValidationError";
    err.errors = { title: { path: "title", message: "bắt buộc" } };

    const { status, body } = chayHandler(err);

    expect(status).toBe(400);
    expect(body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("AIError dùng lại kho mã sẵn có qua err.code dạng chuỗi", () => {
    // Không phải khai báo lại AI_QUOTA_EXCEEDED trong danh mục chung: nhánh "err.code nếu là
    // chuỗi" nhận nó. Điều kiện "là chuỗi" chính là chỗ loại bỏ mã số của MongoDB ở test trên.
    const aiErr = new Error("Hết lượt AI");
    aiErr.status = 429;
    aiErr.code = "AI_QUOTA_EXCEEDED";
    aiErr.isAIError = true;

    const { status, body } = chayHandler(aiErr);

    expect(status).toBe(429);
    expect(body.errorCode).toBe("AI_QUOTA_EXCEEDED");
  });

  it("trường `code` cũ vẫn còn — không phá client đang đọc nó", () => {
    const { body } = chayHandler(createError("x", 400, ErrorCode.VALIDATION_FAILED));
    expect(body).toHaveProperty("code");
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("requestId");
  });
});

describe("errorHandler — điều kiện 'err.code phải là chuỗi'", () => {
  it("lỗi có code SỐ nhưng KHÔNG phải 11000 vẫn không lọt số ra ngoài", () => {
    // Test ở trên ("lỗi trùng khoá MongoDB") KHÔNG kiểm được điều kiện này: với 11000, nhánh
    // quy đổi Mongoose đứng trước và trả "DUPLICATE_KEY" nên nhánh err.code không bao giờ
    // chạy tới. Phát hiện khi gieo đột biến — bỏ điều kiện là-chuỗi mà 12 test vẫn xanh.
    //
    // Driver MongoDB dùng nhiều mã số khác (2 = BadValue, 13 = Unauthorized...). Không có
    // điều kiện này, chúng lọt thẳng vào errorCode dưới dạng SỐ, và mọi phép so sánh chuỗi ở
    // Frontend âm thầm sai.
    const err = new Error("BadValue");
    err.code = 2;

    const { body } = chayHandler(err);

    expect(typeof body.errorCode).toBe("string");
    expect(body.errorCode).toBe("INTERNAL_ERROR");
  });
});
