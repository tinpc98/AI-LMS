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
