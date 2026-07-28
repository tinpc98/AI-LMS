# 📋 Phân Tích & Đánh Giá Hợp Đồng Dữ Liệu API (API Contract Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Hợp Đồng Dữ Liệu (API Contract)](#1-tổng-quan-hợp-đồng-dữ-liệu-api-contract)
2. [Phân Tích Cấu Trúc Response Thành Công (Success Payload Structure)](#2-phân-tích-cấu-trúc-response-thành-công-success-payload-structure)
3. [Phân Tích Cấu Trúc Response Thất Bại & Lỗi (Error Payload Structure)](#3-phân-tích-cấu-trúc-response-thất-bại--lỗi-error-payload-structure)
4. [Bất Đồng Bộ Trong Khai Báo Dữ Liệu Trả Về (Contract Inconsistency)](#4-bất-đồng-bộ-trong-khai-báo-dữ-liệu-trả-về-contract-inconsistency)
5. [Cấu Trúc Phân Trang (Pagination Metadata Matrix)](#5-cấu-trúc-phân-trang-pagination-metadata-matrix)
6. [Bảng Chi Tiết So Sánh Payload Giữa Các Module](#6-bảng-chi-tiết-so-sánh-payload-giữa-các-module)
7. [Khuyến Nghị Chuẩn Hóa API Contract Standard Enterprise](#7-khuyến-nghị-chuẩn-hóa-api-contract-standard-enterprise)

---

## 1. Tổng Quan Hợp Đồng Dữ Liệu (API Contract)

API Contract định nghĩa sự thống nhất về cấu trúc dữ liệu trao đổi giữa Frontend và Backend. Một API Contract đạt chuẩn Enterprise cần đảm bảo:
- Cấu trúc Response đồng nhất ở **mọi** endpoint.
- Kiểu dữ liệu (Data types), tên trường (Field names) tuân theo chuẩn thống nhất (`camelCase`).
- Metadata phân trang (Pagination) có cấu trúc cố định.
- Mã lỗi và thông điệp lỗi dạng chuẩn dễ bóc tách programmatic error codes.

---

## 2. Phân Tích Cấu Trúc Response Thành Công (Success Payload Structure)

Trong codebase hiện tại, tồn tại 2 phong cách trả về dữ liệu thành công hoàn toàn khác nhau:

### Phong Cách A (Sử dụng Helper `sendSuccess` trong `utils/response.js`):
```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Phong Cách B (Trả trực tiếp từ Controller mà không qua Helper - Ví dụ: `auth.controllers.js:login`):
```json
{
  "message": "Đăng nhập thành công!",
  "accessToken": "eyJhbGciOi...",
  "data": { ... }
}
```
❌ **Thiếu trường `success: true`** làm cho Frontend axios/fetch interceptor phải viết nhiều câu lệnh `if/else` để kiểm tra thành công hay thất bại.

---

## 3. Phân Tích Cấu Trúc Response Thất Bại & Lỗi (Error Payload Structure)

### Tồn Tại 3 Định Dạng Lỗi Khác Nhau Trong Cùng Một Ứng Dụng:

1. **Định dạng 1 (Từ Validator Middleware):**
   ```json
   {
     "success": false,
     "message": "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
     "errors": [
       { "field": "email", "message": "Email không hợp lệ" }
     ]
   }
   ```
2. **Định dạng 2 (Từ Auth Middleware):**
   ```json
   {
     "message": "Bạn chưa đăng nhập hệ thống!"
   }
   ```
   ❌ Thiếu `success: false`.
3. **Định dạng 3 (Từ Global Error Handler `main.js`):**
   ```json
   {
     "message": "Đã xảy ra lỗi nội bộ trên Server!",
     "error": {}
   }
   ```

---

## 4. Bất Đồng Bộ Trong Khai Báo Dữ Liệu Trả Về (Contract Inconsistency)

| Thuộc tính | Module A (`ExamSet`) | Module B (`User`) | Module C (`Assignment`) |
| :--- | :--- | :--- | :--- |
| **User ID** | Trả về dưới dạng `ownerId` (Object chứa `_id`, `fullName`) | Trả về `_id` và `id` trùng lặp | Trả về `createdBy` (String ObjectId) |
| **Trạng thái Xóa** | `isDeleted: false` | Thỉnh thoảng trả về cả `isDeleted` | Tự động ẩn field `isDeleted` |
| **Thời gian** | `createdAt` ISO String | `createdAt` ISO String | `createdAt` Unix timestamp ở một số custom aggregate |

---

## 5. Cấu Trúc Phân Trang (Pagination Metadata Matrix)

Độ bất đồng bộ về Pagination Metadata:
- `auth.controllers.js`: `{ total, page, limit, totalPages }`
- `examSet.services.js`: `{ currentPage, pageSize, totalItems, totalPages }` ❌ **Khác tên field!** (`currentPage` vs `page`, `pageSize` vs `limit`).

Điều này khiến cho Frontend không thể viết một Reusable Pagination Component chung mà phải bóc tách thủ công theo từng màn hình!

---

## 6. Bảng Chi Tiết So Sánh Payload Giữa Các Module

| Endpoint | Status Code | Có `success` field? | Pagination Standard? | Error Format Standard? |
| :--- | :---: | :---: | :---: | :---: |
| `POST /api/auth/login` | 200 | ❌ KHÔNG | N/A | ❌ KHÔNG |
| `GET /api/users` | 200 | ✔ CÓ | ⚠ Khác field name | ✔ CÓ |
| `GET /api/exam-sets` | 200 | ✔ CÓ | ❌ Khác field name (`currentPage`) | ✔ CÓ |
| `GET /api/assignments` | 200 | ❌ KHÔNG | ❌ Thiếu pagination | ❌ KHÔNG |

---

## 7. Khuyến Nghị Chuẩn Hóa API Contract Standard Enterprise

Bắt buộc ép 100% Controllers và Middlewares sử dụng duy nhất chuẩn Response qua `sendSuccess` và `sendError`:

### Chuẩn Success:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chuỗi thông báo",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Chuẩn Error:
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Thông báo lỗi",
  "errors": []
}
```
