import { useCallback, useEffect, useState } from "react";

/**
 * Trạng thái bố cục theo bề rộng cửa sổ, dùng chung cho layout học sinh và giáo viên.
 *
 * SỬA MỘT BUG NHÌN THẤY ĐƯỢC (Wave 5 / react-hooks/set-state-in-effect):
 * Bản cũ khởi tạo state bằng giá trị mặc định của desktop rồi gọi handleResize() NGAY
 * TRONG effect để sửa lại:
 *
 *     const [isMobile, setIsMobile] = useState(false);   // luôn bắt đầu là desktop
 *     useEffect(() => { handleResize(); ... }, []);      // sửa lại sau khi đã render
 *
 * Hệ quả: trên điện thoại, người dùng thấy một nhịp giao diện desktop (sidebar mở rộng)
 * rồi mới nháy sang bố cục mobile. Đó là một lần render thừa và một lần nháy giao diện,
 * xảy ra ở MỌI lần vào trang.
 *
 * Cách sửa: tính trạng thái đầu tiên NGAY LÚC KHỞI TẠO state bằng hàm khởi tạo lười của
 * useState. Effect từ đó chỉ còn làm đúng việc nó sinh ra để làm — đăng ký lắng nghe sự
 * kiện resize từ hệ thống bên ngoài.
 *
 * Đồng thời gỡ trùng lặp: HomeLayoutStudent và HomeLayoutTeacher trước đây chứa hai bản
 * sao y hệt nhau của logic này.
 */

import { breakpoints } from "../theme/tokens";

export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

interface LayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  collapsed: boolean;
  screen: BreakpointKey;
}

export const getScreenKey = (width: number): BreakpointKey => {
  if (width >= breakpoints.xxl) return "xxl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "xs";
};

/** Suy ra bố cục từ bề rộng theo chuẩn Ant Design v5 */
export const resolveLayout = (width: number): LayoutState => {
  const screen = getScreenKey(width);
  // Dưới md (< 768px): Mobile view, ẩn Sider, mở Drawer bằng nút hamburger
  if (width < breakpoints.md) {
    return { isMobile: true, isTablet: false, isDesktop: false, collapsed: false, screen };
  }
  // md (768px - 991px): Tablet view, thu gọn Sider thành icon-only 80px
  if (width < breakpoints.lg) {
    return { isMobile: false, isTablet: true, isDesktop: false, collapsed: true, screen };
  }
  // lg trở lên (>= 992px): Desktop view, mở rộng Sider 250px
  return { isMobile: false, isTablet: false, isDesktop: true, collapsed: false, screen };
};

export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState<LayoutState>(() =>
    resolveLayout(typeof window === "undefined" ? breakpoints.lg : window.innerWidth)
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setLayout(resolveLayout(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = useCallback(
    () => setLayout((prev) => ({ ...prev, collapsed: !prev.collapsed })),
    []
  );
  /** Sidebar của antd tự gọi onCollapse(bool) khi người dùng thu/mở bằng nút của nó. */
  const setCollapsed = useCallback(
    (value: boolean) => setLayout((prev) => ({ ...prev, collapsed: value })),
    []
  );
  const toggleMobileDrawer = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);

  return {
    isMobile: layout.isMobile,
    isTablet: layout.isTablet,
    isDesktop: layout.isDesktop,
    collapsed: layout.collapsed,
    screen: layout.screen,
    mobileOpen,
    setCollapsed,
    toggleCollapse,
    toggleMobileDrawer,
    closeMobileDrawer,
  };
};
