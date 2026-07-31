// Test cho asyncHandler (Wave 4.4) và cho hành vi mà nó mở khoá ở errorHandler.
//
// Điểm quan trọng: đây là thay đổi HÀNH VI, không phải di chuyển. Trước Wave 4.4, mỗi
// controller tự try/catch rồi trả 500 cứng — nuốt mất err.status mà tầng service đã đặt.
// Các test dưới đây chốt lại hành vi mới để nó không âm thầm trôi ngược.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { asyncHandler } from "../../../src/shared/utils/asyncHandler.js";
import { errorHandler } from "../../../src/shared/middlewares/errorHandler.middleware.js";
import { NotFoundError, ValidationError } from "../../../src/shared/utils/appError.js";

const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createReq = () => ({ method: "GET", originalUrl: "/api/test", requestId: "req-123" });

describe("asyncHandler", () => {
  it("chuyển lỗi của handler async sang next() thay vì để promise reject trôi mất", async () => {
    const boom = new Error("hỏng");
    const next = vi.fn();
    await asyncHandler(async () => {
      throw boom;
    })(createReq(), createRes(), next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  it("không gọi next() khi handler chạy bình thường", async () => {
    const next = vi.fn();
    const res = createRes();
    await asyncHandler(async (req, r) => r.status(200).json({ ok: true }))(createReq(), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("bắt cả lỗi ném đồng bộ, không chỉ promise reject", async () => {
    const next = vi.fn();
    await asyncHandler(() => {
      throw new Error("lỗi đồng bộ");
    })(createReq(), createRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].message).toBe("lỗi đồng bộ");
  });
});

describe("asyncHandler + errorHandler — hành vi mà try/catch cũ đã nuốt mất", () => {
  let consoleSpy;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => consoleSpy.mockRestore());

  it("GIỮ NGUYÊN status do tầng dưới đặt — trước đây bị ép thành 500", async () => {
    const next = vi.fn();
    const res = createRes();
    await asyncHandler(async () => {
      throw new NotFoundError("Bài giảng không tồn tại");
    })(createReq(), res, next);

    errorHandler(next.mock.calls[0][0], createReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("tôn trọng err.status kiểu tự chế mà nhiều service đang dùng", async () => {
    const next = vi.fn();
    const res = createRes();
    const err = new Error("Không có quyền");
    err.status = 403;
    await asyncHandler(async () => {
      throw err;
    })(createReq(), res, next);

    errorHandler(next.mock.calls[0][0], createReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("gắn requestId vào phản hồi lỗi — thứ khuôn try/catch cũ không có", async () => {
    const res = createRes();
    errorHandler(new ValidationError("sai dữ liệu"), createReq(), res, vi.fn());
    expect(res.json.mock.calls[0][0]).toMatchObject({
      success: false,
      code: "VALIDATION_ERROR",
      requestId: "req-123",
    });
  });

  it("lỗi không xác định vẫn ra 500, và ẩn chi tiết nội bộ ở production", async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const res = createRes();
    errorHandler(new Error("chuỗi kết nối nội bộ bị lộ"), createReq(), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).not.toContain("chuỗi kết nối");
    process.env.NODE_ENV = oldEnv;
  });
});
