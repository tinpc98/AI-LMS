// Chốt hành vi interceptor của axiosClient.
//
// VÌ SAO QUAN TRỌNG: đây là nơi quyết định KHI NÀO người dùng bị tự động đăng xuất. Hai
// hướng hỏng đều tệ:
//   - Quá nhạy: một request 401 lẻ (vd gọi API không có quyền) đá người dùng ra ngoài
//     giữa chừng, mất dữ liệu đang nhập.
//   - Quá lỏng: token hết hạn mà không đăng xuất, người dùng thấy màn hình trống và
//     không hiểu vì sao.
//
// Logic này nằm trong một file rất dễ bị đổi chỗ khi tái cấu trúc (src/api/ -> shared/api/),
// nên cần chốt bằng test trước.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AxiosError } from "axios";
import axiosClient from "../src/api/axiosClient";

/** Lấy hàm xử lý lỗi mà interceptor đã đăng ký, để gọi trực tiếp không cần mạng. */
const getResponseErrorHandler = () => {
  // @ts-expect-error - truy cập nội bộ axios để lấy handler đã đăng ký
  const handlers = axiosClient.interceptors.response.handlers;
  const registered = handlers.filter((h: unknown) => h);
  return registered[registered.length - 1].rejected as (e: unknown) => Promise<never>;
};

const makeError = (status: number, url: string): AxiosError =>
  ({
    response: { status },
    config: { url },
    message: `Request failed with status ${status}`,
    isAxiosError: true,
    toJSON: () => ({}),
    name: "AxiosError",
  }) as AxiosError;

let logoutSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  logoutSpy = vi.fn();
  window.addEventListener("unauthorized-logout", logoutSpy);
});

afterEach(() => {
  window.removeEventListener("unauthorized-logout", logoutSpy);
});

describe("axiosClient — tự động đăng xuất khi phiên hết hạn", () => {
  it("401 trên API cần đăng nhập VÀ đang có token thì phát sự kiện đăng xuất", async () => {
    localStorage.setItem("accessToken", "token-cu");
    const handle = getResponseErrorHandler();

    await expect(handle(makeError(401, "/api/classes"))).rejects.toBeDefined();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it("401 từ chính API ĐĂNG NHẬP thì KHÔNG đăng xuất — đó chỉ là sai mật khẩu", async () => {
    localStorage.setItem("accessToken", "token-cu");
    const handle = getResponseErrorHandler();

    await expect(handle(makeError(401, "/api/auth/login"))).rejects.toBeDefined();

    // Nếu chỗ này phát sự kiện, người dùng nhập sai mật khẩu sẽ bị đá ra màn hình login
    // kèm thông báo "phiên hết hạn" — sai và gây hoang mang.
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it("401 khi CHƯA có token thì không phát sự kiện — không có phiên nào để hết hạn", async () => {
    const handle = getResponseErrorHandler();

    await expect(handle(makeError(401, "/api/classes"))).rejects.toBeDefined();

    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it("403 KHÔNG làm đăng xuất — thiếu quyền khác với hết phiên", async () => {
    localStorage.setItem("accessToken", "token-hop-le");
    const handle = getResponseErrorHandler();

    await expect(handle(makeError(403, "/api/admin/users"))).rejects.toBeDefined();

    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it("lỗi 500 không đụng tới phiên đăng nhập", async () => {
    localStorage.setItem("accessToken", "token-hop-le");
    const handle = getResponseErrorHandler();

    await expect(handle(makeError(500, "/api/classes"))).rejects.toBeDefined();

    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it("luôn ném lỗi tiếp ra ngoài để nơi gọi còn xử lý được", async () => {
    const handle = getResponseErrorHandler();
    const err = makeError(404, "/api/classes/khong-co");
    await expect(handle(err)).rejects.toBe(err);
  });
});
