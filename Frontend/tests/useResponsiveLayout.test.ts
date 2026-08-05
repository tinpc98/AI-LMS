// Chốt việc sửa bug nháy bố cục (Wave 5, react-hooks/set-state-in-effect).
//
// Bản cũ khởi tạo state bằng giá trị mặc định của desktop rồi gọi handleResize() trong
// effect để sửa lại. Trên điện thoại, người dùng thấy một nhịp giao diện desktop rồi mới
// nháy sang mobile — mỗi lần vào trang.
//
// Test quan trọng nhất ở đây là "ngay lần render ĐẦU TIÊN đã đúng bố cục". Nếu ai đó sau
// này đưa việc tính bố cục trở lại vào useEffect, test đó sẽ đỏ.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { resolveLayout, useResponsiveLayout } from "../src/shared/hooks/useResponsiveLayout";

const setWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: w });
};

const originalWidth = window.innerWidth;
beforeEach(() => setWidth(1440));
afterEach(() => setWidth(originalWidth));

describe("resolveLayout — hàm thuần suy bố cục từ bề rộng", () => {
  it.each([
    [375, { isMobile: true, isTablet: false, isDesktop: false, collapsed: false, screen: "xs" }], // điện thoại
    [767, { isMobile: true, isTablet: false, isDesktop: false, collapsed: false, screen: "sm" }], // ngay dưới ngưỡng
    [768, { isMobile: false, isTablet: true, isDesktop: false, collapsed: true, screen: "md" }], // máy tính bảng: thu gọn sidebar
    [1023, { isMobile: false, isTablet: false, isDesktop: true, collapsed: false, screen: "lg" }],
    [1024, { isMobile: false, isTablet: false, isDesktop: true, collapsed: false, screen: "lg" }], // desktop
    [1920, { isMobile: false, isTablet: false, isDesktop: true, collapsed: false, screen: "xxl" }],
  ])("bề rộng %ipx", (width, expected) => {
    expect(resolveLayout(width)).toEqual(expected);
  });
});

describe("useResponsiveLayout", () => {
  it("mount trên điện thoại chỉ tốn ĐÚNG MỘT lần render — không có nhịp hiển thị sai", () => {
    setWidth(375);

    // Đếm số lần render và ghi lại giá trị của TỪNG lần.
    //
    // Không thể kiểm bằng cách đọc result.current sau khi renderHook trả về: Testing
    // Library đã chạy xong effect trước lúc đó, nên giá trị luôn đúng dù bố cục được
    // tính lúc khởi tạo hay được sửa lại trong effect. Tôi đã viết test kiểu đó lúc đầu
    // và nó pass ở CẢ HAI bản — tức là không kiểm được gì.
    //
    // Đếm render thì phân biệt được: tính lúc khởi tạo = 1 lần; sửa trong effect = 2 lần,
    // và lần đầu mang giá trị sai.
    const seen: boolean[] = [];
    renderHook(() => {
      const layout = useResponsiveLayout();
      seen.push(layout.isMobile);
      return layout;
    });

    expect(seen).toEqual([true]);
  });

  it("lần render đầu đúng cả với máy tính bảng", () => {
    setWidth(800);
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.collapsed).toBe(true);
  });

  it("cập nhật khi cửa sổ đổi kích thước", () => {
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      setWidth(375);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.isMobile).toBe(true);
  });

  it("gỡ listener khi unmount — không rò rỉ", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useResponsiveLayout());
    unmount();
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("toggleCollapse đảo trạng thái thu gọn, không đụng tới isMobile", () => {
    setWidth(375);
    const { result } = renderHook(() => useResponsiveLayout());
    const before = result.current.isMobile;

    act(() => result.current.toggleCollapse());

    expect(result.current.collapsed).toBe(true);
    expect(result.current.isMobile).toBe(before);
  });

  it("ngăn kéo mobile mở/đóng độc lập với bố cục", () => {
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.mobileOpen).toBe(false);

    act(() => result.current.toggleMobileDrawer());
    expect(result.current.mobileOpen).toBe(true);

    act(() => result.current.closeMobileDrawer());
    expect(result.current.mobileOpen).toBe(false);
  });
});
