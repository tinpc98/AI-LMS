# 🔐 Phân Tích & Đánh Giá Tầng Xác Thực (Authentication Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Cơ Cơ Chế Xác Thực (Auth System Overview)](#1-tổng-quan-cơ-cơ-chế-xác-thực-auth-system-overview)
2. [Phân Tích Quy Trình Đăng Nhập & Tạo Token (Login & Token Generation)](#2-phân-tích-quy-trình-đăng-nhập--tạo-token-login--token-generation)
3. [Đánh Giá Token Verification Middleware](#3-đánh-giá-token-verification-middleware)
4. [Lỗ Hổng Quản Lý Vòng Đời Token (Token Lifecycle & Revocation Gaps)](#4-lỗ-hổng-quản-lý-vòng-đời-token-token-lifecycle--revocation-gaps)
5. [Tác Động Của Soft Delete Tới Xác Thực (Soft Delete vs Auth)](#5-tác-động-của-soft-delete-tới-xác-thực-soft-delete-vs-auth)
6. [Bảng Đánh Giá Mức Độ An Toàn Tầng Xác Thực (Auth Security Matrix)](#6-bảng-đánh-giá-mức-độ-an-toàn-tầng-xác-thực-auth-security-matrix)
7. [Khuyến Nghị Khắc Phục Lỗ Hổng Bảo Mật Auth](#7-khuyến-nghị-khắc-phục-lỗ-hổng-bảo-mật-auth)

---

## 1. Tổng Quan Cơ Cơ Chế Xác Thực (Auth System Overview)

Hệ thống AI LMS Backend sử dụng cơ chế xác thực dựa trên **JSON Web Token (JWT)** không lưu trạng thái (Stateless Authentication).

- File xử lý chính: [auth.middlewares.js](file:///e:/AI-LMS/Backend/src/middlewares/auth.middlewares.js), [auth.controllers.js](file:///e:/AI-LMS/Backend/src/controllers/auth.controllers.js), [auth.services.js](file:///e:/AI-LMS/Backend/src/services/auth.services.js).
- Thuật toán băm mật khẩu: `bcryptjs` (salt round = 10).

---

## 2. Phân Tích Quy Trình Đăng Nhập & Tạo Token (Login & Token Generation)

### Luồng Đăng Nhập (`loginService` trong `auth.services.js`):
1. Nhận `email` và `password`.
2. Chuẩn hóa email bằng `.trim().toLowerCase()`.
3. Tìm kiếm User qua `User.findOne({ email }).withDeleted()`.
4. Nếu `user.isDeleted == true` ➔ Báo lỗi `403 Tài khoản đã bị vô hiệu hóa`.
5. Băm đối chiếu mật khẩu qua `bcrypt.compare()`.
6. Kiểm tra `user.status` (`Inactive` hoặc `Locked`) ➔ Báo lỗi `403`.
7. Ký JWT Access Token bằng secret key:
   ```javascript
   const accessToken = jwt.sign(
     { id: user._id, email: user.email, role: user.role },
     process.env.JWT_SECRET || "123456",
     { expiresIn: "1d" }
   );
   ```

### 🔴 Điểm Yếu Bảo Mật Rất Nghiêm Trọng Trong Khâu Tạo Token:
1. **Fallback Hardcoded Secret Key:** Nếu biến môi trường `process.env.JWT_SECRET` không được định nghĩa, hệ thống tự động fallback về chuỗi dễ đoán `"123456"`. Kẻ tấn công có thể tự sinh ra JWT hợp lệ với bất kỳ `id` và `role` nào để chiếm quyền toàn bộ hệ thống!
2. **Thiếu Refresh Token Framework:** Đã gọi là JWT Stateless nhưng chỉ phát hành Access Token với hạn dài 1 ngày (`1d`). Nếu Access Token bị rò rỉ (qua XSS hoặc network sniffing), kẻ tấn công có thể mạo danh nạn nhân suốt 24h.

---

## 3. Đánh Giá Token Verification Middleware

Tại file `auth.middlewares.js`:
```javascript
export const verifyUser = (req, res, next) => {
  const { authorization } = req.headers;
  // ...
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456");
  const userId = decoded.id || decoded._id;
  req.user = { ...decoded, id: userId, _id: userId };
  next();
};
```

### ❌ Lỗi Logic Xác Thực Vượt Rào (Bypass Auth):
- **Không truy vấn trạng thái User hiện tại từ Database:** Middleware `verifyUser` chỉ giải mã (decode) chuỗi Token và gán `req.user = decoded`.
- **Hậu quả:** Giả sử Admin vô hiệu hóa (Soft Delete) hoặc Khóa (`Locked`) một người dùng vào thời điểm 10:00 AM, nhưng người dùng đó đã có Token cấp lúc 09:00 AM. Nhờ Token này, họ vẫn có thể gọi tất cả các API private đến 09:00 AM ngày hôm sau mà **không bị chặn**, vì Middleware không kiểm tra lại trạng thái tài khoản trong DB!

---

## 4. Lỗ Hổng Quản Lý Vòng Đời Token (Token Lifecycle & Revocation Gaps)

- **Không có Logout API chuẩn:** Khi học sinh/giáo viên ấn Logout ở Frontend, Backend không hề có endpoint để ghi nhận Blacklist Token hoặc vô hiệu hóa Token.
- **Thiếu Password Changed Invalidation:** Khi người dùng đổi mật khẩu, Token cũ không bị vô hiệu hóa (vì Token không chứa `passwordVersion` hoặc timestamp kiểm tra).

---

## 5. Tác Động Của Soft Delete Tới Xác Thực (Soft Delete vs Auth)

- Mặc dù `loginService` có kiểm tra `user.isDeleted`, nhưng do `verifyUser` không kiểm tra lại DB nên khi tài khoản bị xóa mềm, hệ thống không thể đá session của người dùng ra khỏi ứng dụng lập tức.

---

## 6. Bảng Đánh Giá Mức Độ An Toàn Tầng Xác Thực (Auth Security Matrix)

| Tiêu chí | Trạng thái | Mức độ rủi ro | Chi tiết lỗi |
| :--- | :---: | :---: | :--- |
| **Password Hashing** | ⭐ Tốt | 🟢 Low | Bcrypt 10 rounds, pre-save hook mã hóa tự động. |
| **JWT Secret Safety** | 🔴 Critical | 🔴 Critical | Fallback về `"123456"` nếu thiếu `.env`. |
| **Token Expiration Policy** | ⚠ Cần cải thiện | 🟠 High | Cấp hạn 1 ngày không có Refresh Token rotation. |
| **Token Revocation / Blacklist** | ❌ Sai thiết kế | 🔴 Critical | Không thể thu hồi Token đã phát hành. |
| **Realtime Account Status Check** | ❌ Sai thiết kế | 🔴 Critical | Token vẫn hoạt động khi User bị khóa/xóa mềm. |

---

## 7. Khuyến Nghị Khắc Phục Lỗ Hổng Bảo Mật Auth

1. **Bắt buộc ném lỗi FATAL khi thiếu `JWT_SECRET`:** Không được dùng default fallback key trong code.
2. **Cập nhật `verifyUser` Middleware:** Truy vấn DB hoặc Redis cache để xác nhận `user.status === 'Active'` và `isDeleted === false`.
3. **Triển khai kiến trúc Dual-Token (Access Token 15m + Refresh Token 7d).**
