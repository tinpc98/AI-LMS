// Chốt hành vi phiên đăng nhập và phân vai.
//
// useAuth là mắt xích khép kín vòng tự động đăng xuất: axiosClient phát sự kiện
// "unauthorized-logout", hook này lắng nghe và dọn phiên. Test tests/axiosClient.test.ts
// đã chốt phía PHÁT; đây chốt phía NHẬN. Đứt một trong hai đầu thì token hết hạn sẽ không
// còn đá người dùng ra, và họ ngồi trước màn hình trống không hiểu vì sao.
//
// Hook cũng quyết định isTeacher/isStudent/isAdmin — thứ mọi guard phân quyền dựa vào.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../src/hooks/useAuth";

vi.mock("../src/shared/lib/socketClient", () => ({ disconnectSocket: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

const setSession = (role: string) => {
  localStorage.setItem("accessToken", "token-xyz");
  localStorage.setItem("user", JSON.stringify({ _id: "u1", fullName: "Người dùng", role }));
  localStorage.setItem("userRole", role);
};

beforeEach(() => localStorage.clear());

describe("useAuth — khôi phục phiên", () => {
  it("đọc lại người dùng từ localStorage khi khởi tạo", () => {
    setSession("Teacher");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.fullName).toBe("Người dùng");
  });

  it("chưa đăng nhập thì user là null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });
});

describe("useAuth — phân vai (mọi guard phân quyền dựa vào đây)", () => {
  it.each([
    ["Teacher", { isTeacher: true, isStudent: false, isAdmin: false }],
    ["Student", { isTeacher: false, isStudent: true, isAdmin: false }],
    ["Admin", { isTeacher: false, isStudent: false, isAdmin: true }],
  ])("vai trò %s được nhận đúng", (role, expected) => {
    setSession(role);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect({
      isTeacher: result.current.isTeacher,
      isStudent: result.current.isStudent,
      isAdmin: result.current.isAdmin,
    }).toEqual(expected);
  });

  it("so khớp vai trò KHÔNG phân biệt hoa thường — Backend trả 'Teacher', code so 'teacher'", () => {
    setSession("TEACHER");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isTeacher).toBe(true);
  });
});

describe("useAuth — đăng xuất", () => {
  it("logout() xoá sạch phiên trong localStorage", () => {
    setSession("Student");
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout());

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("sự kiện 'unauthorized-logout' từ axiosClient KHÉP KÍN được vòng đăng xuất", () => {
    setSession("Student");
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      window.dispatchEvent(new Event("unauthorized-logout"));
    });

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("gỡ listener khi unmount — tránh rò rỉ và đăng xuất component đã chết", () => {
    setSession("Student");
    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();
    localStorage.setItem("accessToken", "token-moi");

    window.dispatchEvent(new Event("unauthorized-logout"));

    // Hook đã unmount thì không được đụng vào phiên mới.
    expect(localStorage.getItem("accessToken")).toBe("token-moi");
  });
});
