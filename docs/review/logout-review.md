# 🚪 Phân Tích & Audit Quy Trình Đăng Xuất (Logout Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Luồng Đăng Xuất (Logout Flow Overview)](#1-tổng-quan-luồng-đăng-xuất-logout-flow-overview)
2. [Rà Soát Hàm `logout` Trong `useAuth.ts`](#2-rà-soát-hàm-logout-trong-useauthts)
3. [Phân Tích Dọn Dẹp Bộ Nhớ Browser (LocalStorage Cleanup)](#3-phân-tích-dọn-dẹp-bộ-nhớ-browser-localstorage-cleanup)
4. [Đánh Giá Hành Vi Sau Đăng Xuất (Post-Logout Behavior)](#4-đánh-giá-hành-vi-sau-đăng-xuất-post-logout-behavior)
5. [Tóm Tắt Khắc Phục Lỗi Logout Triệt Để](#5-tóm-tắt-khắc-phục-lỗi-logout-triệt-để)

---

## 1. Tổng Quan Luồng Đăng Xuất (Logout Flow Overview)

Quy trình đăng xuất (Logout) có nhiệm vụ hủy bỏ phiên làm việc của người dùng ở Client, xóa sạch toàn bộ các chứng thư xác thực (`accessToken`) và vai trò (`userRole`), đồng thời điều hướng người dùng về trang Đăng nhập (`/login`) mà không gây nạp lại trang (Hard Reload).

---

## 2. Rà Soát Hàm `logout` Trong `useAuth.ts`

```typescript
const logout = useCallback(() => {
  // 1. Xóa sạch toàn bộ chứng thư xác thực trong Browser Storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");

  // 2. Reset React Component State
  setUser(null);

  // 3. Điều hướng mượt mà bằng React Router (0 Reload)
  navigate("/login", { replace: true });
}, [navigate]);
```

---

## 3. Phân Tích Dọn Dẹp Bộ Nhớ Browser (LocalStorage Cleanup)

| Tên Key Storage | Trạng Thái Trước Audit | Trạng Thái Sau Đăng Xuất | Đánh Giá |
| :--- | :---: | :---: | :---: |
| `accessToken` | Chứa JWT string | **REMOVED** (Đã xóa) | ⭐ Chuẩn an toàn |
| `userRole` | Chứa role string | **REMOVED** (Đã xóa) | ⭐ Chuẩn an toàn |
| `user` | Chứa JSON user object | **REMOVED** (Đã xóa) | ⭐ Chuẩn an toàn |

---

## 4. Đánh Giá Hành Vi Sau Đăng Xuất (Post-Logout Behavior)

- ✅ **Chống rò rỉ phiên:** Khi đăng xuất thành công, dữ liệu `user` trong React State trở về `null`.
- ✅ **Chống Browser Back:** Nếu người dùng nhấn nút Back trên trình duyệt sau khi Logout, `ProtectedRoute` lập tức chặn lại do `accessToken` đã bị xóa, tự động đẩy về `/login`.
- ✅ **Không reload trang:** Điều hướng bằng `navigate('/login', { replace: true })`.

---

## 5. Tóm Tắt Khắc Phục Lỗi Logout Triệt Để

- Đã giải quyết hoàn toàn tình trạng "Xóa `accessToken` nhưng quên xóa `userRole`".
- Đã đồng bộ sự kiện `unauthorized-logout` từ `axiosClient` về `useAuth` để tự động logout mượt mà khi gặp lỗi 401.
