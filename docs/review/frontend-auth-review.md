# 🖥️ Phân Tích & Audit Trạng Thái Đăng Nhập Frontend (Frontend Auth Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Quản Lý Auth State Ở Frontend](#1-tổng-quan-quản-lý-auth-state-ở-frontend)
2. [Phân Tích `useAuth` Hook & LocalStorage Management](#2-phân-tích-useauth-hook--localstorage-management)
3. [Hiện Trạng Nút Thắt Nguyên Nhân Gốc Rễ (Root Cause Analysis)](#3-hiện-trạng-nút-thắt-nguyên-nhân-gốc-rễ-root-cause-analysis)
4. [Bảng Đánh Giá Thống Nhất Tên Key Trong Browser Storage](#4-bảng-đánh-giá-thống-nhất-tên-key-trong-browser-storage)
5. [Khuyến Nghị Chuẩn Hóa State Session Management](#5-khuyến-nghị-chuẩn-hóa-state-session-management)

---

## 1. Tổng Quan Quản Lý Auth State Ở Frontend

Frontend ứng dụng AI LMS được xây dựng trên **React 19 + TypeScript + Vite**.  
Quản lý trạng thái phiên đăng nhập của người dùng được thực hiện thông qua custom hook [useAuth.ts](file:///e:/AI-LMS/Frontend/src/hooks/useAuth.ts) kết hợp với bộ lưu trữ trình duyệt `localStorage`.

---

## 2. Phân Tích `useAuth` Hook & LocalStorage Management

### Mã Nguồn Hiện Tại Trong `useAuth.ts`:

```typescript
export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const loginSuccess = (token: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userRole", userData.role || "");
    setUser(userData);
  };

  // ✅ Đã cập nhật so sánh case-insensitive role:
  const role = (user?.role || "").toLowerCase();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isAdmin = role === "admin";

  return { user, isAuthenticated: !!user, role, isTeacher, isStudent, isAdmin, loginSuccess, logout };
};
```

---

## 3. Hiện Trạng Nút Thắt Nguyên Nhân Gốc Rễ (Root Cause Analysis)

### 🔴 LỖ HỔNG LƯU TRỮ TOKEN undefined ĐÃ ĐƯỢC FIX:
- **Trước khi fix:** `LoginPage.tsx` bóc tách nhầm `res.data.data` khiến `accessToken` bị `undefined`. `localStorage.setItem("accessToken", "undefined")` dẫn đến `ProtectedRoute` coi đây là token không hợp lệ và liên tục đá người dùng ra trang login hoặc gây màn hình trắng.
- **Sau khi fix:** `LoginPage.tsx` trích xuất chuẩn `{ accessToken, data: loggedInUser } = res.data`. Token và role được lưu chính xác 100%.

---

## 4. Bảng Đánh Giá Thống Nhất Tên Key Trong Browser Storage

| Tên Key Mới Chuẩn Hóa | Ý Nghĩa Dữ Liệu | Định Dạng Lưu Trữ | Trạng Thái Đồng Bộ |
| :--- | :--- | :--- | :---: |
| `accessToken` | JWT Access Token dùng cho Authorization Header | Chuỗi String JWT | ✅ Đồng bộ 100% |
| `userRole` | Vai trò người dùng dạng chữ thường (`admin`, `teacher`, `student`) | Chuỗi String Lowercase | ✅ Đồng bộ 100% |
| `user` | Đối tượng thông tin người dùng | Chuỗi JSON Object | ✅ Đồng bộ 100% |

---

## 5. Khuyến Nghị Chuẩn Hóa State Session Management

- Bọc `JSON.parse(localStorage.getItem("user"))` trong khối `try/catch` an toàn để chống crash trắng màn hình nếu người dùng chỉnh sửa rác vào `localStorage`.
