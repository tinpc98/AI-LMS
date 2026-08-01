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

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

interface LayoutState {
  isMobile: boolean;
  collapsed: boolean;
}

/** Suy ra bố cục từ bề rộng. Hàm thuần để test được và để dùng lại lúc khởi tạo. */
export const resolveLayout = (width: number): LayoutState => {
  if (width < MOBILE_MAX) return { isMobile: true, collapsed: false };
  if (width < TABLET_MAX) return { isMobile: false, collapsed: true };
  return { isMobile: false, collapsed: false };
};

export const useResponsiveLayout = () => {
  // Hàm khởi tạo lười: chạy MỘT LẦN trước lần render đầu tiên, nên không có nhịp nào
  // hiển thị sai bố cục.
  const [layout, setLayout] = useState<LayoutState>(() =>
    resolveLayout(typeof window === "undefined" ? TABLET_MAX : window.innerWidth)
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
    collapsed: layout.collapsed,
    mobileOpen,
    setCollapsed,
    toggleCollapse,
    toggleMobileDrawer,
    closeMobileDrawer,
  };
};
