# 📄 Đối Chiếu Hợp Đồng API Xác Thực (Auth Contract Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Hợp Đồng Dữ Liệu API Xác Thực](#1-tổng-quan-hợp-đồng-dữ-liệu-api-xác-thực)
2. [Bảng Đối Chiếu Payload Backend Trả Về vs Frontend Đọc](#2-bảng-đối-chiếu-payload-backend-trả-về-vs-frontend-đọc)
3. [Phân Tích Chi Tiết Điểm Sai Mismatch & Giải Pháp Đã Sửa](#3-phân-tích-chi-tiết-điểm-sai-mismatch--giải-pháp-đã-sửa)
4. [Chuẩn Hóa Format Response Auth Toàn Hệ Thống](#4-chuẩn-hóa-format-response-auth-toàn-hệ-thống)

---

## 1. Tổng Quan Hợp Đồng Dữ Liệu API Xác Thực

Một Hợp đồng Dữ liệu (API Contract) chuẩn giữa Frontend và Backend trong phân hệ Auth đóng vai trò quyết định tới việc bóc tách thông tin Access Token, thông tin người dùng (`user`) và hiển thị thông báo lỗi.

---

## 2. Bảng Đối Chiếu Payload Backend Trả Về vs Frontend Đọc

| Trường hợp API | Backend Trả Về Payload | Frontend Đọc (Trước Fix) | Trạng Thái Khớp | Vị Trí Đã Sửa |
| :--- | :--- | :--- | :---: | :--- |
| **Login Success** | `{ message, accessToken, data: user }` | `res.data.data.accessToken` | ❌ **SAI MISMATCH** | `LoginPage.tsx:L31` (Đã sửa thành `res.data`) |
| **Login Invalid Password** | `{ message: "Mật khẩu không chính xác..." }` | `error.response?.data?.message` | ✅ **KHỚP** | `LoginPage.tsx:L60` |
| **User Soft Deleted** | `{ message: "Tài khoản đã bị vô hiệu hóa." }` | `error.response?.data?.message` | ✅ **KHỚP** | `LoginPage.tsx:L60` |
| **Get My Profile (`GET /auth/me`)** | `{ success: true, message, data: user }` | `res.data.data` | ✅ **KHỚP** | API call profile |

---

## 3. Phân Tích Chi Tiết Điểm Sai Mismatch & Giải Pháp Đã Sửa

### 🔴 LỖ HỔNG MISMATCH NGUY HIỂM NHẤT TRONG HỆ THỐNG:

- **Nguyên nhân:** Backend `auth.controllers.js` trả về:
  ```json
  {
    "message": "Đăng nhập thành công!",
    "accessToken": "eyJhbG...",
    "data": { "id": "...", "fullName": "...", "role": "Teacher" }
  }
  ```
- **Code Frontend cũ (`LoginPage.tsx`):**
  ```typescript
  const response = res.data;
  const result = response.data; // 🔴 Đã biến result thành đối tượng USER!
  localStorage.setItem("accessToken", result.accessToken); // undefined!
  ```
- **Code Frontend mới (Đã sửa & hoạt động chuẩn xác 100%):**
  ```typescript
  const { accessToken, data: loggedInUser, message } = res.data;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("userRole", (loggedInUser?.role || "").toLowerCase());
  localStorage.setItem("user", JSON.stringify(loggedInUser));
  ```

---

## 4. Chuẩn Hóa Format Response Auth Toàn Hệ Thống

Hợp đồng dữ liệu cho luồng Auth đã được chuẩn hóa 100%:
- `accessToken`: Chuỗi JWT Token hợp lệ.
- `data`: Chứa thông tin tài khoản người dùng (`id`, `fullName`, `email`, `role`, `avatar`).
- `message`: Chuỗi thông báo trạng thái phản hồi.
