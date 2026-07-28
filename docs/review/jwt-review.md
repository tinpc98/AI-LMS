# 🔑 Phân Tích & Đánh Giá Cấu Trúc JWT (JWT Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Thiết Kế JSON Web Token (JWT)](#1-tổng-quan-thiết-kế-json-web-token-jwt)
2. [Phân Tích Cấu Trúc Payload & Thuật Toán Ký](#2-phân-tích-cấu-trúc-payload--thuật-toán-ký)
3. [Quy Trình Tạo & Xác Thực Token (Sign & Verify Lifecycle)](#3-quy-trình-tạo--xác-thực-token-sign--verify-lifecycle)
4. [Hiểm Họa Bảo Mật & Rủi Ro Soft Delete Bypass](#4-hiểm-họa-bảo-mật--rủi-ro-soft-delete-bypass)
5. [Đánh Giá Khắc Phục Lỗ Hổng Bảo Mật JWT](#5-đánh-giá-khắc-phục-lỗ-hổng-bảo-mật-jwt)

---

## 1. Tổng Quan Thiết Kế JSON Web Token (JWT)

Trong hệ thống AI LMS, **JSON Web Token (JWT)** đóng vai trò là chứng thư xác thực không lưu trạng thái (Stateless Credential) giữa Client và Server.

- **Nơi phát hành (Sign):** [auth.services.js:L40](file:///e:/AI-LMS/Backend/src/services/auth.services.js#L40)
- **Nơi xác thực (Verify):** [auth.middlewares.js:L18](file:///e:/AI-LMS/Backend/src/middlewares/auth.middlewares.js#L18)

---

## 2. Phân Tích Cấu Trúc Payload & Thuật Toán Ký

### Payload khi Ký (`jwt.sign`):
```json
{
  "id": "60d5ec49f1b2c81234567890",
  "email": "student@edusynth.ai",
  "role": "Student",
  "iat": 1785123400,
  "exp": 1785209800
}
```

- **Thuật toán ký:** `HS256` (HMAC với SHA-256).
- **Thời hạn hiệu lực (`expiresIn`):** `1d` (24 giờ).
- **Các trường trong Payload:**
  - `id`: ObjectId đại diện cho User trong MongoDB.
  - `email`: Địa chỉ email người dùng.
  - `role`: Vai trò (`Admin`, `Teacher`, `Student`).
  - `iat`: Timestamp phát hành Token.
  - `exp`: Timestamp hết hạn Token.

---

## 3. Quy Trình Tạo & Xác Thực Token (Sign & Verify Lifecycle)

```mermaid
graph LR
    A[Client gửi Credentials] --> B[Server gọi jwt.sign()]
    B --> C[Trả Access Token 1d về Client]
    C --> D[Client lưu LocalStorage]
    D --> E[Client đính kèm Authorization: Bearer Header]
    E --> F[Server gọi jwt.verify()]
    F --> G[Server query DB check User status & Soft Delete]
    G --> H[Ủy quyền gọi Controller]
```

---

## 4. Hiểm Họa Bảo Mật & Rủi Ro Soft Delete Bypass

### 🔴 LỖ HỔNG VÀ NGUY CƠ ĐÃ ĐƯỢC PHÁT HIỆN:

1. **Fallback Hardcoded Secret String (`"123456"`):**
   - **Thực trạng:** Code dùng `process.env.JWT_SECRET || "123456"`.
   - **Nguy cơ:** Kẻ tấn công có thể tự dùng thư viện `jsonwebtoken` cục bộ để tạo ra JWT với bất kỳ `id` và `role: "Admin"` nào để chiếm quyền toàn bộ hệ thống nếu biến môi trường `JWT_SECRET` bị thiếu.
2. **Nguy Cơ Truy Cập Trái Phép Sau Khi Soft Delete (Đã Khắc Phục):**
   - **Thực trạng cũ:** Middleware `verifyUser` chỉ giải mã chữ ký JWT mà không kiểm tra DB. Token cũ vẫn dùng được 24h sau khi User bị xóa mềm.
   - **Giải pháp khắc phục:** Cập nhật `verifyUser` query `User.findById(userId)` trực tiếp ở từng request.

---

## 5. Đánh Giá Khắc Phục Lỗ Hổng Bảo Mật JWT

- ✅ **Chuẩn hóa ID:** Middleware đính kèm đồng thời cả `req.user.id` và `req.user._id` để tránh lỗi mismatch giữa các controller handler.
- ✅ **Kiểm tra trạng thái DB realtime:** Loại bỏ hoàn toàn nguy cơ dùng token cũ sau khi bị khóa hoặc xóa mềm.
