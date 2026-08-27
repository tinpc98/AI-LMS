// Test cho resetUserPassword — chốt lỗi thật đã tìm và sửa trong đợt review toàn dự án:
// trước đây frontend gửi thẳng chuỗi hardcode "defaultPassword123!" cho MỌI lần admin reset mật
// khẩu (qua PUT /users/:id chung, không có endpoint riêng) — bất kỳ ai đọc được source code
// frontend cũng đăng nhập được vào tài khoản vừa bị reset. Endpoint mới sinh mật khẩu ngẫu nhiên
// ở server, không nhận password từ client.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const userFindById = vi.fn();
vi.mock("#modules/auth/user.model.js", () => ({
  default: { findById: (...a) => userFindById(...a) },
}));
vi.mock("#modules/auth/auth.service.js", () => ({
  loginService: vi.fn(),
  getUserTrashService: vi.fn(),
  restoreUserService: vi.fn(),
  permanentDeleteUserService: vi.fn(),
}));

const { resetUserPassword } = await import("#modules/auth/auth.controller.js");

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const USER_ID = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resetUserPassword", () => {
  it("BUG ĐÃ SỬA — sinh mật khẩu ngẫu nhiên ở server, KHÔNG nhận password từ req.body", async () => {
    const userDoc = { _id: USER_ID, password: "old-hash", save: vi.fn().mockResolvedValue(true) };
    userFindById.mockResolvedValue(userDoc);

    const req = { params: { id: USER_ID }, body: { password: "attacker-controlled-value" } };
    const res = makeRes();

    await resetUserPassword(req, res);

    // Password mới KHÔNG được lấy từ req.body — server tự sinh, không phụ thuộc client.
    expect(userDoc.password).not.toBe("attacker-controlled-value");
    expect(userDoc.password.length).toBeGreaterThanOrEqual(10);
    expect(userDoc.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.newPassword).toBe(userDoc.password);
  });

  it("2 lần gọi liên tiếp cho cùng user → sinh 2 mật khẩu KHÁC NHAU (không phải hằng số cố định)", async () => {
    const userDoc1 = { _id: USER_ID, password: "old", save: vi.fn().mockResolvedValue(true) };
    const userDoc2 = { _id: USER_ID, password: "old", save: vi.fn().mockResolvedValue(true) };
    userFindById.mockResolvedValueOnce(userDoc1).mockResolvedValueOnce(userDoc2);

    const req = { params: { id: USER_ID }, body: {} };
    await resetUserPassword(req, makeRes());
    await resetUserPassword(req, makeRes());

    expect(userDoc1.password).not.toBe(userDoc2.password);
  });

  it("User không tồn tại → 404", async () => {
    userFindById.mockResolvedValue(null);
    const req = { params: { id: USER_ID }, body: {} };
    const res = makeRes();

    await resetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("ID không hợp lệ → 400, không chạm DB", async () => {
    const req = { params: { id: "khong-hop-le" }, body: {} };
    const res = makeRes();

    await resetUserPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userFindById).not.toHaveBeenCalled();
  });
});
