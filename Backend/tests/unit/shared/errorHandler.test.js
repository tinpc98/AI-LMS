import { describe, it, expect, afterEach, vi } from "vitest";
import { errorHandler, notFoundHandler } from "#shared/middlewares/errorHandler.middleware.js";
import { NotFoundError } from "#shared/utils/appError.js";

const makeReq = (overrides = {}) => ({
  requestId: "test-request-id",
  method: "GET",
  originalUrl: "/api/test",
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  res.setHeader = vi.fn();
  return res;
};

const ORIGINAL_ENV = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  vi.restoreAllMocks();
  vi.spyOn(console, "error").mockRestore?.();
});

describe("errorHandler", () => {
  it("Lỗi AppError (có status/code) trả đúng status và envelope chuẩn", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new NotFoundError("Không tìm thấy lớp học");
    const req = makeReq();
    const res = makeRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe("Không tìm thấy lớp học");
    expect(body.code).toBe("NOT_FOUND");
    expect(body.requestId).toBe("test-request-id");
  });

  it("Lỗi không xác định (500) ở production: che message thật, không lộ stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "production";
    const err = new Error("chi tiết nội bộ nhạy cảm: SELECT * FROM users");
    const req = makeReq();
    const res = makeRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("Đã xảy ra lỗi nội bộ trên Server!");
    expect(body.message).not.toContain("SELECT");
    expect(body.stack).toBeUndefined();
  });

  it("Lỗi không xác định (500) ở development: giữ message thật + có stack để debug", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "development";
    const err = new Error("lỗi debug chi tiết");
    const req = makeReq();
    const res = makeRes();

    errorHandler(err, req, res, () => {});

    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("lỗi debug chi tiết");
    expect(body.stack).toBeTruthy();
  });

  it("Lỗi có details thì đính kèm details vào response", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new NotFoundError("x");
    err.details = { field: "classId" };
    const req = makeReq();
    const res = makeRes();

    errorHandler(err, req, res, () => {});

    expect(res.json.mock.calls[0][0].details).toEqual({ field: "classId" });
  });

  it("Không có requestId (vd. lỗi xảy ra trước middleware requestId) vẫn không crash", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new NotFoundError("x");
    const req = makeReq({ requestId: undefined });
    const res = makeRes();

    expect(() => errorHandler(err, req, res, () => {})).not.toThrow();
    expect(res.json.mock.calls[0][0].requestId).toBe(null);
  });
});

describe("notFoundHandler", () => {
  it("Trả 404 với code ROUTE_NOT_FOUND", () => {
    const req = makeReq();
    const res = makeRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.code).toBe("ROUTE_NOT_FOUND");
  });
});

// ── Wave 4.4: quy đổi lỗi Mongoose/MongoDB sang mã HTTP đúng bản chất ──────────
//
// Trước Wave 4.4 chỉ 2/25 controller tự kiểm error.name === "ValidationError" để trả 400.
// 23 controller còn lại trả 500 cho lỗi hoàn toàn do phía client gây ra. Gom về đây thì
// mọi endpoint — kể cả endpoint viết sau này — đều đúng theo mặc định.
describe("errorHandler — quy đổi lỗi Mongoose", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => consoleSpy.mockClear());

  it("ValidationError của Mongoose trả 400 kèm danh sách trường sai, KHÔNG phải 500", () => {
    const err = new Error("Class validation failed");
    err.name = "ValidationError";
    err.errors = {
      status: { path: "status", message: "`Active` is not a valid enum value" },
      className: { path: "className", message: "Tên lớp là bắt buộc" },
    };

    const res = makeRes();
    errorHandler(err, makeReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.details).toEqual([
      { field: "status", message: "`Active` is not a valid enum value" },
      { field: "className", message: "Tên lớp là bắt buộc" },
    ]);
  });

  it("CastError (ObjectId sai định dạng trên URL) trả 400 với code INVALID_ID", () => {
    const err = new Error("Cast to ObjectId failed");
    err.name = "CastError";
    err.path = "_id";
    err.value = "khong-phai-objectid";

    const res = makeRes();
    errorHandler(err, makeReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe("INVALID_ID");
  });

  it("vi phạm unique index trả 409 chứ không phải 400 — dữ liệu hợp lệ, chỉ là trùng", () => {
    const err = new Error("E11000 duplicate key error");
    err.code = 11000;
    err.keyPattern = { classCode: 1 };

    const res = makeRes();
    errorHandler(err, makeReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe("DUPLICATE_KEY");
    expect(body.details[0].field).toBe("classCode");
  });

  it("err.status do tầng dưới đặt vẫn được ưu tiên hơn quy đổi Mongoose", () => {
    const err = new Error("không có quyền");
    err.name = "ValidationError";
    err.errors = {};
    err.status = 403;

    const res = makeRes();
    errorHandler(err, makeReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("lỗi thường không có tên đặc biệt vẫn ra 500", () => {
    const res = makeRes();
    errorHandler(new Error("hỏng bất ngờ"), makeReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
