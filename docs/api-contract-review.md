# KIỂM TRẢ VÀ ĐÁNH GIÁ CHUẨN HÓA API CONTRACT (API CONTRACT REVIEW)

Tài liệu này đánh giá tính nhất quán và chuẩn hóa của hạ tầng API Backend (Response format, Error format, Status code, Pagination, Validation, và điểm bất khập giữa Frontend - Backend).

---

## 📑 MỤC LỤC
1. [Đánh giá Cấu trúc Response (Response Format Consistency)](#1-đánh-giá-cấu-trúc-response-response-format-consistency)
2. [Đánh giá Định dạng Lỗi (Error Format)](#2-đánh-giá-định-dạng-lỗi-error-format)
3. [Đánh giá Phân trang (Pagination)](#3-đánh-giá-phân-trang-pagination)
4. [Đánh giá Mã Trạng thái HTTP (HTTP Status Codes)](#4-đánh-giá-mã-trạng-thái-http-http-status-codes)
5. [Bất cập Lệch Contract Giữa Frontend và Backend (Contract Mismatches)](#5-bất-cập-lệch-contract-giữa-frontend-và-backend-contract-mismatches)
6. [Đề xuất Chuẩn hóa (Standardization Recommendations)](#6-đề-xuất-chuẩn-hóa-standardization-recommendations)

---

## 1. ĐÁNH GIÁ CẤU TRÚC RESPONSE (RESPONSE FORMAT CONSISTENCY)

Hiện tại định dạng Response giữa các Controllers chưa đồng nhất 100%:

| Controller Module | Format Trả về Hiện tại | Nhận xét |
| :--- | :--- | :--- |
| `auth.controllers.js` | `{ message: "...", data: { ... } }` | Khá chuẩn |
| `class.controller.js` | `{ message: "...", data: { ... } }` | Khá chuẩn |
| `grade.controller.js` | `{ success: true, data: [ ... ] }` | Dùng thuộc tính `success` |
| `live.controller.js` | `{ success: true, data: { ... } }` | Dùng thuộc tính `success` |
| `assignment.controller.js` | `{ assignment: { ... } }` hoặc `{ submissions: [ ... ] }` | Trả về key trực tiếp không bọc trong `data` |
| `announcement.controller.js`| `{ data: [ ... ] }` hoặc `{ items: [ ... ] }` | Lẫn lộn giữa key `data` và `items` |

---

## 2. ĐÁNH GIÁ ĐỊNH DẠNG LỖI (ERROR FORMAT)

- **Trạm xử lý lỗi tập trung (`main.js`)**:
  ```json
  {
    "message": "Đã xảy ra lỗi nội bộ trên Server!",
    "error": "Error stack string..."
  }
  ```
- **Các Controller lẻ**: Một số controller trả về `{ message: "Lỗi..." }`, một số trả về `{ success: false, message: "Lỗi..." }`.

---

## 3. ĐÁNH GIÁ PHÂN TRANG (PAGINATION)

- **Hiện trạng**: Hầu hết các API lấy danh sách (`GET /api/users`, `GET /api/classes`, `GET /api/courses`, `GET /api/questions`) đang trả về toàn bộ mảng dữ liệu (`Array.find()`) mà chưa áp dụng Phân trang (`page`, `limit`, `skip`).
- **Rủi ro**: Khi cơ sở dữ liệu phình to lên hàng chục nghìn bản ghi, các API này sẽ gây treo Memory của Node.js Server và làm chậm thời gian phản hồi HTTP Response.

---

## 4. ĐÁNH GIÁ MÃ TRẠNG THÁI HTTP (HTTP STATUS CODES)

Tất cả các Controllers đều tuân thủ tốt các mã trạng thái chuẩn:
- `200 OK`: Trả về dữ liệu thành công.
- `201 Created`: Tạo thành công tài nguyên mới (User, Class, Assignment, Exam).
- `400 Bad Request`: Validation đầu vào thất bại.
- `401 Unauthorized`: Thiếu hoặc hỏng JWT Token.
- `403 Forbidden`: Truy cập trái phép phân quyền RBAC.
- `404 Not Found`: Không tìm thấy ID tài nguyên.
- `500 Internal Server Error`: Bắt lỗi ngoại lệ server.

---

## 5. BẤT CẬP LỆCH CONTRACT GIỮA FRONTEND VÀ BACKEND (CONTRACT MISMATCHES)

Qua đối chiếu source code Frontend API files và Backend Routers, phát hiện **2 điểm lệch Contract nghiêm trọng**:

1. **API Sinh đề thi tự động AI**:
   - **Frontend (`examApi.ts`)**: Gọi `POST /api/exams/auto-generate`
   - **Backend (`exam.routes.js`)**: Định nghĩa `POST /api/exams/generate-auto`
   - **Hậu quả**: Khi Frontend bấm "Sinh đề thi AI", Server sẽ trả về `404 Not Found`!
   - **Khắc phục đề xuất**: Thêm Alias Route trong `exam.routes.js`: `router.post("/auto-generate", verifyUser, isTeacher, autoGenerateExam);`.

2. **API Chấm điểm bài thi tự luận**:
   - **Frontend (`examApi.ts`)**: Gọi `POST /api/exam-attempts/:id/grade-essay`
   - **Backend (`examAttempt.routes.js`)**: Định nghĩa `PUT /api/exam-attempts/:id/grade-essay`
   - **Hậu quả**: Khi Giáo viên chấm điểm tự luận, Server trả về `404 Not Found` (do sai HTTP Method)!
   - **Khắc phục đề xuất**: Hỗ trợ cả `PUT` và `POST` trong `examAttempt.routes.js`.

---

## 6. ĐỀ XUẤT CHUẨN HÓA (STANDARDIZATION RECOMMENDATIONS)

1. **Chuẩn hóa API Response Wrapper**: Đồng nhất 100% API trả về cấu trúc:
   ```typescript
   interface ApiResponse<T> {
     success: boolean;
     message: string;
     data: T | null;
     pagination?: {
       page: number;
       limit: number;
       totalItems: number;
       totalPages: number;
     };
   }
   ```
2. **Khắc phục ngay 2 điểm lệch Route/Method**: Sửa bổ sung Route alias trên Backend để Frontend gọi không bị lỗi 404.
