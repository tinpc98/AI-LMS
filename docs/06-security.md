# Báo cáo Kiểm toán Bảo mật Hệ thống (Security Audit Report)

Tài liệu đánh giá toàn diện về an toàn thông tin, lỗ hổng bảo mật và đề xuất khắc phục cho Hệ thống AI-LMS.

---

## 📑 MỤC LỤC
1. [Tổng quan Báo cáo Kiểm toán](#1-tổng-quan-báo-cáo-kiểm-toán)
2. [Ma trận Đánh giá Rủi ro Bảo mật (Security Risk Matrix)](#2-ma-trận-đánh-giá-rủi-ro-bảo-mật-security-risk-matrix)
3. [Phân tích Chi tiết Hạng mục Bảo mật](#3-phân-tích-chi-tiết-hạng-mục-bảo-mật)
   - [3.1 Xác thực & Quản lý Token (JWT Security)](#31-xác-thực--quản-lý-token-jwt-security)
   - [3.2 Phân quyền Người dùng (RBAC & Route Guards)](#32-phân-quyền-người-dùng-rbac--route-guards)
   - [3.3 Mã hóa Mật khẩu (Password Hashing)](#33-mã-hóa-mật-khẩu-password-hashing)
   - [3.4 Kiểm tra Dữ liệu Đầu vào (Validation & Sanitization)](#34-kiểm-tra-dữ-liệu-đầu-vào-validation--sanitization)
   - [3.5 Chống tấn công XSS & CSRF](#35-chống-tấn-công-xss--csrf)
   - [3.6 Chống tấn công NoSQL Injection (Mongo Injection)](#36-chống-tấn-công-nosql-injection-mongo-injection)
   - [3.7 Giới hạn Tần suất Request (Rate Limiting)](#37-giới-hạn-tần-suất-request-rate-limiting)
   - [3.8 Bảo mật Tệp đính kèm (File Upload Security)](#38-bảo-mật-tệp-đính-kèm-file-upload-security)
   - [3.9 Bảo mật Kết nối Realtime (Socket.io Security)](#39-bảo-mật-kết-nối-realtime-socketio-security)
   - [3.10 Quản lý Biến môi trường & Secrets](#310-quản-lý-biến-môi-trường--secrets)
   - [3.11 Xử lý Lỗi & Nhật ký Hệ thống (Logging & Error Handling)](#311-xử-lý-lỗi--nhật-ký-hệ-thống-logging--error-handling)
4. [Lộ trình Khắc phục Lỗ hổng Đề xuất (Security Remediation Roadmap)](#4-lộ-trình-khắc-phục-lỗ-hổng-đề-xuất-security-remediation-roadmap)

---

## 1. TỔNG QUAN BÁO CÁO KIỂM TOÁN

Đánh giá bảo mật toàn diện trên hai phân hệ Frontend (React 19) và Backend (Node.js/Express/MongoDB). Hệ thống đã đạt chuẩn bảo mật cơ bản với **BCCRYPT Password Hashing**, **JWT Stateless Auth**, **Mongoose Schema Type Enforcement** và **Enterprise Soft Delete**. Tuy nhiên, vẫn còn một số điểm cần gia cố để bảo vệ hệ thống trước các cuộc tấn công nâng cao.

---

## 2. MA TRẬN ĐÁNH GIÁ RỦI RO BẢO MẬT (SECURITY RISK MATRIX)

| Hạng mục Bảo mật | Mức độ Rủi ro | Trạng thái Hiện tại | Đánh giá & Nguy cơ |
| :--- | :---: | :---: | :--- |
| **JWT Expiration & Refresh** | `Medium` | ⚠️ Cần cải thiện | Token hiện tại có thời hạn 1 ngày (`1d`), chưa triển khai cơ chế Refresh Token và Token Blacklisting khi Logout. |
| **Rate Limiting (Chống DoS)** | `High` | 🔴 Thiếu sót | Chưa tích hợp Middleware `express-rate-limit`. Nguy cơ bị tấn công Brute-Force mật khẩu tại endpoint `/api/auth/login`. |
| **NoSQL Injection** | `Low` | ✅ An toàn | Mongoose Schema ép kiểu dữ liệu chặt chẽ và chuẩn hóa chuỗi đầu vào. |
| **CSRF Protection** | `Low` | ✅ An toàn | Sử dụng JWT trong Authorization Header thay vì lưu trữ Cookie không bảo vệ `SameSite`. |
| **XSS (Cross-Site Scripting)** | `Low` | ✅ An toàn | React 19 tự động escape dữ liệu khi render JSX, chống chèn mã độc HTML/JS. |
| **Password Security** | `Low` | ✅ An toàn | Mã hóa mật khẩu bằng `bcryptjs` với 10 vòng muối mã hóa trong pre-save hook. |
| **Role-Based Access Control** | `Low` | ✅ An toàn | Phân quyền 2 lớp: Frontend `ProtectedRoute` và Backend `verifyRole` Middleware. |
| **File Upload Vulnerability** | `Medium` | ⚠️ Cần cải thiện | Upload file qua Cloudinary. Cần siết chặt kiểm tra MIME Type và dung lượng file tối đa tại Backend Express. |
| **Socket.io Security** | `Medium` | ⚠️ Cần cải thiện | Kết nối WebSocket hiện chưa gắn Middleware xác thực Token JWT trước khi handshake. |

---

## 3. PHÂN TÍCH CHI TIẾT HẠNG MỤC BẢO MẬT

### 3.1 Xác thực & Quản lý Token (JWT Security)
- **Hiện trạng**: Server mã hóa thông tin User (`id`, `email`, `role`) thành chuỗi JWT bằng secret bí mật `process.env.JWT_SECRET`.
- **Điểm yếu**: Lưu trữ `accessToken` ở `localStorage` của trình duyệt có nguy cơ bị đọc nếu ứng dụng dính lỗi XSS từ thư viện thứ 3. Khi người dùng bấm Logout, token cũ chưa bị đưa vào Blacklist (Redis) nên vẫn có hiệu lực cho đến khi hết hạn.

### 3.2 Phân quyền Người dùng (RBAC & Route Guards)
- **Thiết kế 2 lớp**:
  1. **Frontend**: Component `ProtectedRoute` tự động đối chiếu `allowedRoles` đối với `userRole`. Nếu Học sinh cố tình truy cập tuyến đường của Giáo viên, hệ thống lập tức chuyển hướng về `/student`.
  2. **Backend**: Middleware `verifyRole(["admin", "teacher"])` chặn triệt để mọi truy cập trái phép cấp API.

### 3.3 Mã hóa Mật khẩu (Password Hashing)
- **Hiện trạng**: Mongoose Pre-save Hook kiểm tra nếu trường `password` bị thay đổi và chưa được mã hóa bcrypt (nhận diện qua Regex `/\$2[aby]\$\d{2}\$/`), hệ thống tự động sinh Salt và mã hóa với `bcrypt.hash(password, 10)`.

### 3.4 Kiểm tra Dữ liệu Đầu vào (Validation & Sanitization)
- **Hiện trạng**: Mongoose Schemas định nghĩa rõ ràng kiểu dữ liệu, các ràng buộc `minlength`, `maxlength`, `min`, `max`, `enum` và các hàm `validate` tùy chỉnh (ví dụ: validate tổng điểm bài thi phải bằng `10.0`).

### 3.5 Chống tấn công XSS & CSRF
- **XSS**: Dữ liệu phản hồi hiển thị trên React 19 được mã hóa ký tự đặc biệt tự động. Không sử dụng `dangerouslySetInnerHTML`.
- **CSRF**: Hệ thống không dùng Cookie lưu Session ID nên hoàn toàn miễn nhiễm với các kịch bản Cross-Site Request Forgery thông thường.

### 3.6 Chống tấn công NoSQL Injection (Mongo Injection)
- Mongoose tự động ép kiểu đối tượng truyền vào Query. Chuỗi Email đăng nhập được ép kiểu về String thô `String(email).trim().toLowerCase()` trước khi đưa vào `User.findOne()`, loại bỏ nguy cơ chèn query object (vd: `{ "$ne": null }`).

---

## 4. LỘ TRÌNH KHẮC PHỤC LỖ HỔNG ĐỀ XUẤT (SECURITY REMEDIATION ROADMAP)

### Bước 1: Triển khai Rate Limiter cho Auth APIs (Ưu tiên Cao)
Cài đặt thư viện `express-rate-limit` vào Express Server:
```javascript
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần thử đăng nhập sai trên 1 IP
  message: { message: "Quá nhiều lần thử đăng nhập sai, vui lòng thử lại sau 15 phút!" }
});
```

### Bước 2: Bảo mật Socket.io Handshake (Ưu tiên Trung bình)
Chèn middleware xác thực JWT khi thiết lập kết nối WebSocket:
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});
```

### Bước 3: Rà soát File Upload Filter (Ưu tiên Trung bình)
Sử dụng `multer` kiểm tra định dạng tập tin chỉ cho phép `.pdf`, `.docx`, `.png`, `.jpg`, `.zip` và giới hạn dung lượng tối đa 10MB trước khi gửi tới Cloudinary API.
