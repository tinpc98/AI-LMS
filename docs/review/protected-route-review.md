# 🛣️ Phân Tích & Audit Protected Route & Public Route (Protected Route Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Định Tuyến React Router v6](#1-tổng-quan-định-tuyến-react-router-v6)
2. [Phân Tích Component `ProtectedRoute.tsx`](#2-phân-tích-component-protectedroutetsx)
3. [Phân Tích Component `PublicRoute.tsx`](#3-phân-tích-component-publicroutetsx)
4. [Bảng Kiểm Tra Chống Loop & Màn Hình Trắng (Loop & White Screen Verification)](#4-bảng-kiểm-tra-chống-loop--màn-hình-trắng-loop--white-screen-verification)
5. [Đánh Giá Khắc Phục Lỗi Điều Hướng Nâng Cao](#5-đánh-giá-khắc-phục-lỗi-điều-hướng-nâng-cao)

---

## 1. Tổng Quan Định Tuyến React Router v6

Hệ thống định tuyến Frontend trong [App.tsx](file:///e:/AI-LMS/Frontend/src/App.tsx) sử dụng **React Router v6** kết hợp với 2 Guard Components chính:
- `PublicRoute`: Chặn người dùng đã đăng nhập quay lại trang `/login`.
- `ProtectedRoute`: Chặn người dùng chưa đăng nhập hoặc không đúng `allowedRoles` truy cập các phân hệ `/admin`, `/teacher`, `/student`.

---

## 2. Phân Tích Component `ProtectedRoute.tsx`

```typescript
export default function ProtectedRoute({ allowedRoles }: Props) {
  const token = localStorage.getItem("accessToken");
  const rawRole = localStorage.getItem("userRole");
  const role = rawRole?.toLowerCase();

  // 1. Kiểm tra Token hợp lệ (Xử lý chuỗi rác "undefined" hoặc "null")
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra Role hợp lệ
  const VALID_ROLES = ["student", "teacher", "admin"];
  if (!role || !VALID_ROLES.includes(role)) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  // 3. Admin Super Access
  if (role === "admin") {
    return <Outlet />;
  }

  // 4. Role Guard Matching
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
  if (!normalizedAllowedRoles.includes(role)) {
    if (role === "student") return <Navigate to="/student" replace />;
    if (role === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

---

## 3. Phân Tích Component `PublicRoute.tsx`

Component [PublicRoute.tsx](file:///e:/AI-LMS/Frontend/src/components/common/PublicRoute.tsx):
- Kiểm tra nếu `token` hợp lệ VÀ `role` hợp lệ ➔ Tự động điều hướng về đúng trang chủ theo vai trò:
  - `admin` ➔ `/admin`
  - `teacher` ➔ `/teacher`
  - `student` ➔ `/student`
- Giúp người dùng đã đăng nhập không bao giờ bị thấy lại màn hình Đăng nhập khi bấm phím Back trên trình duyệt.

---

## 4. Bảng Kiểm Tra Chống Loop & Màn Hình Trắng (Loop & White Screen Verification)

| Nguy Cơ Điều Hướng | Trạng Thái Trước Audit | Trạng Thái Sau Khắc Phục | Đánh Giá |
| :--- | :--- | :--- | :---: |
| **Token dạng `"undefined"` trong LocalStorage** | Gây Redirect Loop liên tục giữa `/student` và `/login` | Xóa storage và điều hướng an toàn về `/login` | ⭐ Đã sửa triệt để |
| **Chữ hoa/thường Role bị lệch (`"Student"` vs `"student"`)** | Bị từ chối quyền, trả về màn hình trắng | Đã `.toLowerCase()` đồng bộ 100% | ⭐ Đã sửa triệt để |
| **Bấm Back trình duyệt sau Logout** | Quay lại trang protected cũ | `PublicRoute` và `ProtectedRoute` chặn và đẩy về `/login` | ⭐ Đã sửa triệt để |

---

## 5. Đánh Giá Khắc Phục Lỗi Điều Hướng Nâng Cao

- ✅ Không return `null` vô thời hạn.
- ✅ Sử dụng `<Navigate to="..." replace />` ngăn chặn rác lịch sử trình duyệt.
