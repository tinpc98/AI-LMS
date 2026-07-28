# 📋 Phân Tích & Đánh Giá API Đăng Nhập Backend (Login Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Đánh Giá API Login](#1-tổng-quan-đánh-giá-api-login)
2. [Rà Soát Kỹ Thuật API `POST /api/auth/login`](#2-rà-soát-kỹ-thuật-api-post-apiauthlogin)
3. [Bảng Ma Trận Kiểm Thử Kịch Bản Đăng Nhập (Login Scenario Test Matrix)](#3-bảng-ma-trận-kiểm-thử-kịch-bản-đăng-nhập-login-scenario-test-matrix)
4. [Đánh Giá Bảo Mật & Thông Điệp Lỗi (Error Information Leakage)](#4-đánh-giá-bảo-mật--thông-điệp-lỗi-error-information-leakage)

---

## 1. Tổng Quan Đánh Giá API Login

API `POST /api/auth/login` là cửa ngõ xác thực đầu tiên của hệ thống AI LMS. Nhiệm vụ của API này là xác minh danh tính người dùng qua Email và Password, sau đó cấp phát JWT Access Token nếu tài khoản ở trạng thái hoạt động bình thường.

- **Vị trí Route:** [Backend/src/routers/user.routes.js:L18](file:///e:/AI-LMS/Backend/src/routers/user.routes.js#L18)
- **Vị trí Controller:** [Backend/src/controllers/auth.controllers.js:L5](file:///e:/AI-LMS/Backend/src/controllers/auth.controllers.js#L5)
- **Vị trí Service:** [Backend/src/services/auth.services.js:L5](file:///e:/AI-LMS/Backend/src/services/auth.services.js#L5)

---

## 2. Rà Soát Kỹ Thuật API `POST /api/auth/login`

| Tiêu Chí Rà Soát | Kết Quả Trong Source Code | Đánh Giá | Ghi Chú Kỹ Thuật |
| :--- | :--- | :---: | :--- |
| **Email Normalization** | Chạy `normalizeEmail()` trong Validator và `.trim().toLowerCase()` trong Service | ⭐ Tốt | Đảm bảo không bị lệch do gõ hoa/thường hoặc khoảng trắng thừa. |
| **Password Validation** | Kiểm tra rỗng trong `loginValidation` | ⭐ Tốt | Đầy đủ validation sơ bộ. |
| **Lộ Thông Tin User (User Enumeration)** | Ném thông báo `"Tài khoản hoặc email không tồn tại trên hệ thống!"` | ⚠ Cần lưu ý | Nên chuyển thành `"Email hoặc mật khẩu không chính xác"` để chống dò Email. |
| **Soft Delete Check (`isDeleted`)** | Truy vấn `.withDeleted()` và check `if (user.isDeleted)` | ⭐ Tốt | Trả về HTTP 403 khi tài khoản đã bị xóa mềm. |
| **Account Status Check** | Check `user.status === "Inactive" || user.status === "Locked"` | ⭐ Tốt | Trả về HTTP 403 khi tài khoản bị khóa. |
| **Bcrypt Compare Order** | `bcrypt.compare(password, user.password)` | ⭐ Tốt | Đúng thứ tự: Chuỗi thô trước, Hashed string sau. |
| **Rò Rỉ Password Hash** | Controller trả về `user` object thông qua `loginService` | ⭐ Tốt | Service chỉ chọn `id`, `fullName`, `email`, `role`, `avatar`. Password không bị trả về FE. |
| **JWT Secret Source** | `process.env.JWT_SECRET \|\| "123456"` | 🔴 Rủi ro | Tồn tại fallback secret string `"123456"`. |
| **JWT Expiration** | `expiresIn: "1d"` | ⭐ Tốt | Hạn 24 giờ. |

---

## 3. Bảng Ma Trận Kiểm Thử Kịch Bản Đăng Nhập (Login Scenario Test Matrix)

| Kịch Bản Input | Trạng Thái DB | Expected HTTP Status | Expected Response Message | Kết Quả Thực Tế |
| :--- | :--- | :---: | :--- | :---: |
| **Email & Password đúng** | Active, `isDeleted: false` | **200 OK** | `"Đăng nhập thành công!"` + `accessToken` | **PASS** |
| **Email đúng, Password sai** | Active, `isDeleted: false` | **401 Unauthorized** | `"Mật khẩu không chính xác, vui lòng thử lại!"` | **PASS** |
| **Email không tồn tại** | Not found | **401 Unauthorized** | `"Tài khoản hoặc email không tồn tại trên hệ thống!"` | **PASS** |
| **User bị Soft Delete** | `isDeleted: true` | **403 Forbidden** | `"Tài khoản đã bị vô hiệu hóa."` | **PASS** |
| **Tài khoản bị Khóa** | `status: "Locked"` | **403 Forbidden** | `"Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!"` | **PASS** |
| **Thiếu Email / Password** | N/A | **400 Bad Request** | `"Email không được để trống!"` / `"Vui lòng nhập đầy đủ..."` | **PASS** |
| **Payload sai định dạng** | N/A (Email sai format) | **400 Bad Request** | `"Email không đúng định dạng!"` | **PASS** |

---

## 4. Đánh Giá Bảo Mật & Thông Điệp Lỗi (Error Information Leakage)

- ✅ Controller luôn có khối `try/catch` bắt lỗi từ Service và trả về đúng status code `error.status || 500`.
- ✅ Không xảy ra lỗi `next is not a function` do `loginValidation` kết thúc bằng `handleValidationErrors` (không gọi `next()` sai cách).
- ❌ Cần loại bỏ fallback secret `"123456"` trong `auth.services.js:L42`.
