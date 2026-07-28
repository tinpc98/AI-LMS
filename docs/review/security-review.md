# 🛡️ Phân Tích & Đánh Giá An Ninh Bảo Mật (Security Review - OWASP Top 10)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Đánh Giá An Ninh Bảo Mật](#1-tổng-quan-đánh-giá-an-ninh-bảo-mật)
2. [Đánh Giá Theo Tiêu Chuẩn OWASP Top 10](#2-đánh-giá-theo-tiêu-chuẩn-owasp-top-10)
   - [A01:2021 - Broken Access Control (Lỗi Phân Quyền)](#a012021---broken-access-control-lỗi-phân-quyền)
   - [A02:2021 - Cryptographic Failures (Lỗi Mã Hóa)](#a022021---cryptographic-failures-lỗi-mã-hóa)
   - [A03:2021 - Injection (NoSQL Injection & XSS)](#a032021---injection-nosql-injection--xss)
   - [A04:2021 - Insecure Design (Thiết Kế Không An Toàn)](#a042021---insecure-design-thiết-kế-không-an-toàn)
   - [A05:2021 - Security Misconfiguration (Lỗi Cấu Hình Bảo Mật)](#a052021---security-misconfiguration-lỗi-cấu-hình-bảo-mật)
   - [A07:2021 - Identification & Authentication Failures](#a072021---identification--authentication-failures)
3. [Phân Tích Chi Tiết Các Lỗ Hổng Bảo Mật Nguy Hiểm](#3-phân-tích-chi-tiết-các-lỗ-hổng-bảo-mật-nguy-hiểm)
   - [3.1 Fallback JWT Secret Hardcoded](#31-fallback-jwt-secret-hardcoded)
   - [3.2 Nguy Cơ NoSQL Injection Qua Unsanitized `req.body`](#32-nguy-cơ-nosql-injection-qua-unsanitized-reqbody)
   - [3.3 Thiếu Helmet & Rate Limiting Toàn Cục](#33-thiếu-helmet--rate-limiting-toàn-cục)
   - [3.4 XSS Vulnerability Trong Rich Text Lesson & Announcement](#34-xss-vulnerability-trong-rich-text-lesson--announcement)
4. [Bảng Ma Trận Lỗ Hổng Bảo Mật OWASP (OWASP Risk Rating)](#4-bảng-ma-trận-lỗ-hổng-bảo-mật-owasp-owasp-risk-rating)
5. [Khuyến Nghị Khắc Phục An Ninh Bảo Mật Khẩn Cấp](#5-khuyến-nghị-khắc-phục-an-ninh-bảo-mật-khẩn-cấp)

---

## 1. Tổng Quan Đánh Giá An Ninh Bảo Mật

Báo cáo an ninh này đánh giá hệ thống Backend AI LMS dựa trên khung chuẩn quốc tế **OWASP Top 10 (2021)**. Kết quả đánh giá ghi nhận hệ thống có 2 lỗ hổng cấp độ **CRITICAL**, 4 lỗ hổng **HIGH** và nhiều sơ hở cấu hình môi trường có thể bị khai thác trực tiếp trên môi trường Production.

---

## 2. Đánh Giá Theo Tiêu Chuẩn OWASP Top 10

### A01:2021 - Broken Access Control (Lỗi Phân Quyền) 🔴 CRITICAL
- Bị rò rỉ IDOR tại các endpoint bài nộp (`Submission`) và bài thi (`ExamAttempt`). Xem chi tiết tại [rbac-review.md](file:///e:/AI-LMS/docs/review/rbac-review.md).

### A02:2021 - Cryptographic Failures (Lỗi Mã Hóa) 🔴 CRITICAL
- Hardcoded JWT Secret Fallback `"123456"` trong `auth.middlewares.js` và `auth.services.js`.
- Không mã hóa dữ liệu nhạy cảm của người dùng khi lưu DB ngoại trừ mật khẩu.

### A03:2021 - Injection (NoSQL Injection & XSS) 🟠 HIGH
- Thiếu middleware sanitize NoSQL Injection (như `express-mongo-sanitize`). Nếu client gửi payload JSON: `{ "email": { "$gt": "" }, "password": "xxx" }`, câu lệnh `User.findOne(req.body)` ở một số controller không qua validation sẽ bị qua mặt (bypass).
- Rich Text HTML content trong Lesson / Announcement không được lọc XSS qua `DOMPurify` / `sanitize-html` ở Backend trước khi lưu DB.

### A04:2021 - Insecure Design (Thiết Kế Không An Toàn) 🟠 HIGH
- Thiếu cơ chế Rate Limiting (Chống Brute Force) cho API `/api/auth/login`. Kẻ tấn công có thể thực hiện hàng triệu request thử mật khẩu liên tục mà không bị khóa IP hay Captcha.

### A05:2021 - Security Misconfiguration (Lỗi Cấu Hình Bảo Mật) 🟡 MEDIUM
- **Thiếu thư viện `helmet`:** Server không thiết lập các HTTP Security Headers chuẩn như `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (HSTS).
- File [main.js](file:///e:/AI-LMS/Backend/main.js#L117) trả về full `err.stack` trace khi `NODE_ENV === 'development'`, dễ bị rò rỉ cấu trúc thư mục server nếu quên đổi ENV trên Production.

### A07:2021 - Identification & Authentication Failures 🔴 CRITICAL
- Token không thể vô hiệu hóa (Revoke) và không có cơ chế Logout phía Backend.

---

## 3. Phân Tích Chi Tiết Các Lỗ Hổng Bảo Mật Nguy Hiểm

### 3.1 Fallback JWT Secret Hardcoded
- **Vị trí:** [auth.middlewares.js:L18](file:///e:/AI-LMS/Backend/src/middlewares/auth.middlewares.js#L18) & [auth.services.js:L42](file:///e:/AI-LMS/Backend/src/services/auth.services.js#L42)
- **Code:** `process.env.JWT_SECRET || "123456"`
- **Kịch bản khai thác:** Kẻ tấn công phát hiện ứng dụng chạy container Docker mới mà quên load file `.env`. Họ tự dùng thư viện `jsonwebtoken` trên máy cục bộ ký 1 token với secret `"123456"` mang role `"Admin"` và user ID bất kỳ. Server sẽ chấp nhận token này là hợp lệ 100%!

---

## 4. Bảng Ma Trận Lỗ Hổng Bảo Mật OWASP (OWASP Risk Rating)

| Mã OWASP | Tên Lỗ Hổng | Mức Độ | File Ảnh Hưởng | Trạng Thái Khắc Phục |
| :--- | :--- | :---: | :--- | :---: |
| **A01:2021** | IDOR / Broken Access Control | 🔴 CRITICAL | `assignment.controller.js`, `examAttempt.controller.js` | Chưa fix |
| **A02:2021** | Fallback Hardcoded Secret Key | 🔴 CRITICAL | `auth.middlewares.js`, `auth.services.js` | Chưa fix |
| **A03:2021** | NoSQL Injection Risk | 🟠 HIGH | Controllers dùng raw `req.body` | Chưa fix |
| **A03:2021** | Stored XSS in Lesson Content | 🟠 HIGH | `lesson.controller.js` | Chưa fix |
| **A04:2021** | Lack of Rate Limiting (Brute force) | 🟠 HIGH | `main.js`, `user.routes.js` | Chưa fix |
| **A05:2021** | Missing Security Headers (Helmet) | 🟡 MEDIUM | `main.js` | Chưa fix |

---

## 5. Khuyến Nghị Khắc Phục An Ninh Bảo Mật Khẩn Cấp

1. **Cài đặt & tích hợp ngay các thư viện Security Middleware vào `main.js`:**
   - `helmet()` (Bảo vệ HTTP Headers)
   - `express-rate-limit` (Chống Spam / Brute Force Login)
   - `express-mongo-sanitize` (Loại bỏ ký tự `$` và `.` trong request parameters)
2. Xóa bỏ hoàn toàn các chuỗi fallback `"123456"` trong code. Throw Exception dừng server ngay lập tức nếu thiếu `process.env.JWT_SECRET`.
