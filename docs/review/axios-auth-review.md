# 🌐 Phân Tích & Audit Axios Interceptor & HTTP Transport (Axios Auth Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Cấu Hình Axios Client](#1-tổng-quan-cấu-hình-axios-client)
2. [Phân Tích Request Interceptor (Đính Kèm Bearer Token)](#2-phân-tích-request-interceptor-đính-kèm-bearer-token)
3. [Phân Tích Response Interceptor (Xử Lý Lỗi 401, 403, 500)](#3-phân-tích-response-interceptor-xử-lý-lỗi-401-403-500)
4. [Bảng Phân Loại Hành Vi Lỗi HTTP Trong Interceptor](#4-bảng-phân-loại-hành-vi-lỗi-http-trong-interceptor)
5. [Đánh Giá Khắc Phục Lỗi Hard Reload Trong Interceptor](#5-đánh-giá-khắc-phục-lỗi-hard-reload-trong-interceptor)

---

## 1. Tổng Quan Cấu Hình Axios Client

File [axiosClient.ts](file:///e:/AI-LMS/Frontend/src/api/axiosClient.ts) chịu trách nhiệm khởi tạo `axios` instance và định nghĩa bộ chặn HTTP Request/Response (Interceptors) cho toàn bộ ứng dụng Frontend.

---

## 2. Phân Tích Request Interceptor (Đính Kèm Bearer Token)

```typescript
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);
```

- ⭐ **Đánh giá:** Lấy đúng key `accessToken` và tự động gắn `Authorization: Bearer <token>` Header cho mọi API request.

---

## 3. Phân Tích Response Interceptor (Xử Lý Lỗi 401, 403, 500)

### 🔴 LỖ HỔNG HARD RELOAD ĐÃ ĐƯỢC FIX:
- **Thực trạng cũ:** Khi nhận HTTP 401 từ API, interceptor chạy `window.location.href = "/login"`. Việc này gây reload lại toàn bộ trang web trình duyệt, phá hủy SPA state.
- **Mã nguồn cải tiến:**
```typescript
    const requestUrl = error.config?.url || "";
    const isLoginRequest = requestUrl.includes("/api/auth/login");

    // Chỉ tự động xử lý 401 cho các protected API, KHÔNG can thiệp vào API login
    if (error.response?.status === 401 && !isLoginRequest) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        toast.error("Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!");
        // Phát sự kiện toàn cục để useAuth tự động logout an toàn qua React Router (0 RELOAD)
        window.dispatchEvent(new Event("unauthorized-logout"));
      }
    } else if (error.response?.status === 403) {
      toast.error("Bạn không có quyền thực hiện thao tác này!");
    }

    return Promise.reject(error);
```

---

## 4. Bảng Phân Loại Hành Vi Lỗi HTTP Trong Interceptor

| Mã Lỗi HTTP | Loại Request | Hành Vi Interceptor | Ảnh Hưởng Tới Session | Đánh Giá |
| :--- | :--- | :--- | :--- | :---: |
| **401 Unauthorized** | `POST /api/auth/login` | Bỏ qua, reject Promise về LoginPage | **GIỮ NGUYÊN** (Không Logout) | ⭐ Đúng chuẩn |
| **401 Unauthorized** | Protected APIs (`GET /api/users/me`) | Dispatch `unauthorized-logout` | **XÓA SESSION & NAVIGATE /login** | ⭐ Đúng chuẩn |
| **403 Forbidden** | Protected APIs | Toast báo từ chối truy cập | **GIỮ NGUYÊN** (Không Logout) | ⭐ Đúng chuẩn |
| **500 Server Error** | Mọi APIs | Reject Promise về Component | **GIỮ NGUYÊN** (Không Logout) | ⭐ Đúng chuẩn |

---

## 5. Đánh Giá Khắc Phục Lỗi Hard Reload Trong Interceptor

- ✅ Loại bỏ hoàn toàn `window.location.href` khỏi `axiosClient.ts`.
- ✅ Phân biệt rõ ràng lỗi 401 của API Login và lỗi 401 do hết hạn Token.
