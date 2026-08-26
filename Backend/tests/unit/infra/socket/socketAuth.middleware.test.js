// Test cho socketAuthMiddleware — chốt lỗi thật đã tìm và sửa trong đợt review toàn dự án:
// middleware trước đây chỉ kiểm tra isDeleted, không kiểm tra status (Locked/Inactive/Expired)
// như verifyUser bên HTTP (auth.middleware.js) — tài khoản bị khóa vẫn kết nối/chat qua
// WebSocket bình thường cho tới khi JWT tự hết hạn.
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

const userFindOne = vi.fn();
vi.mock("#modules/auth", () => ({
  User: { findOne: (...a) => userFindOne(...a) },
}));

const { socketAuthMiddleware } = await import("#infra/socket/socketAuth.middleware.js");

const makeSocket = (user) => ({
  handshake: { auth: { token: "valid-token" }, headers: {} },
});

const mongooseSelect = (result) => ({ select: () => Promise.resolve(result) });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret";
  vi.spyOn(jwt, "verify").mockReturnValue({ id: "u1" });
});

describe("socketAuthMiddleware — chặn tài khoản bị khóa/hết hạn", () => {
  it("status=Locked → next(error), KHÔNG gán socket.user", async () => {
    userFindOne.mockReturnValue(
      mongooseSelect({
        _id: "u1",
        role: "student",
        email: "a@b.com",
        fullName: "A",
        status: "Locked",
      })
    );
    const socket = makeSocket();
    const next = vi.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.data.code).toBe("SOCKET_AUTH_ACCOUNT_LOCKED");
    expect(socket.user).toBeUndefined();
  });

  it("status=Inactive hoặc Expired → cũng bị chặn", async () => {
    for (const status of ["Inactive", "Expired"]) {
      userFindOne.mockReturnValue(
        mongooseSelect({ _id: "u1", role: "student", email: "a@b.com", fullName: "A", status })
      );
      const socket = makeSocket();
      const next = vi.fn();
      await socketAuthMiddleware(socket, next);
      expect(next.mock.calls[0][0]?.data?.code).toBe("SOCKET_AUTH_ACCOUNT_LOCKED");
    }
  });

  it("status hợp lệ (Active) → next() không lỗi, gán socket.user", async () => {
    userFindOne.mockReturnValue(
      mongooseSelect({
        _id: "u1",
        role: "student",
        email: "a@b.com",
        fullName: "A",
        status: "Active",
      })
    );
    const socket = makeSocket();
    const next = vi.fn();

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.user).toMatchObject({ id: "u1", role: "student" });
  });
});
