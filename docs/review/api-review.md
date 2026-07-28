# 🌐 Phân Tích & Đánh Giá Thiết Kế API (API Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Thiết Kế API](#1-tổng-quan-thiết-kế-api)
2. [Đánh Giá Chuẩn RESTful & Naming Conventions](#2-đánh-giá-chuẩn-restful--naming-conventions)
3. [Phân Tích HTTP Methods & Status Codes](#3-phân-tích-http-methods--status-codes)
4. [Phân Trang, Lọc & Sắp Xếp (Pagination, Filter, Search, Sort)](#4-phân-trang-lọc--sắp-xếp-pagination-filter-search-sort)
5. [Xử Lý Upload File & Media Assets](#5-xử-lý-upload-file--media-assets)
6. [Bảng Đánh Giá Chi Tiết Danh Sách API (API Audit Table)](#6-bảng-đánh-giá-chi-tiết-danh-sách-api-api-audit-table)
7. [Khuyến Nghị Chuẩn Hóa API](#7-khuyến-nghị-chuẩn-hóa-api)

---

## 1. Tổng Quan Thiết Kế API

Hệ thống AI LMS Backend cung cấp hơn 70 RESTful endpoints phục vụ các chức năng từ Quản lý người dùng, Lớp học, Bài thi đến Báo cáo thống kê.

Về cơ bản, hệ thống áp dụng các quy chuẩn đặt tên tài nguyên theo số nhiều (plural resources) và sử dụng JSON payload. Tuy nhiên, qua quá trình kiểm duyệt chi tiết, phát hiện nhiều điểm chưa đạt chuẩn RESTful, bất đồng bộ về URL path (số ít vs số nhiều), dùng sai HTTP Method và thiếu chuẩn hóa tham số Query.

---

## 2. Đánh Giá Chuẩn RESTful & Naming Conventions

### ❌ Các Vi Phạm Naming Convention Rõ Rệt:

1. **Bất đồng bộ Danh từ Số ít / Số nhiều trên URL Prefix:**
   - `/api/classes` (Số nhiều) ➔ Standard REST
   - `/api/assignments` (Số nhiều) ➔ Standard REST
   - `/api/lesson` (Số ít - [main.js:L85](file:///e:/AI-LMS/Backend/main.js#L85)) ❌ **Lỗi REST Naming!** Đúng ra phải là `/api/lessons`.
2. **Dùng Động Từ Trong REST Endpoint Path:**
   - [examSet.routes.js](file:///e:/AI-LMS/Backend/src/routers/examSet.routes.js): `/api/exam-sets/:id/duplicate` ❌ Đưa động từ vào URL path. Chuẩn REST nên là `POST /api/exam-sets/:id/clones` hoặc `POST /api/exam-sets?action=duplicate`.
   - `/api/exam-attempts/:id/submit` ❌ Dùng động từ `submit`.
3. **Cấu trúc URL lồng nhau thiếu thống nhất:**
   - Lấy bài nộp của bài tập: `/api/assignments/:assignmentId/submissions` (Đúng chuẩn).
   - Lấy danh sách học sinh lớp: `/api/classes/:id/students` (Đúng chuẩn).
   - Nhưng lấy bài học của lớp lại dùng: `/api/lesson?classId=xxx` thay vì `/api/classes/:classId/lessons`.

---

## 3. Phân Tích HTTP Methods & Status Codes

| Trường hợp | Hiện trạng trong Code | Chuẩn RESTful Kỳ Vọng | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Tạo mới tài nguyên** | Trả về HTTP `200 OK` ở nhiều controller | Trả về HTTP `201 Created` | ⚠ Chưa chuẩn |
| **Cập nhật dữ liệu** | Sử dụng `PUT` cho cả cập nhật từng phần | Dùng `PATCH` cho cập nhật một số field | ⚠ Chưa chuẩn |
| **Xóa tài nguyên** | Trả về `{ success: true }` với status `200` | Trả về HTTP `200 OK` hoặc `204 No Content` | ⭐ Tốt |
| **Lỗi Validate** | Đôi khi trả về HTTP `500` do unhandled exception | Bắt buộc trả về HTTP `400 Bad Request` | ❌ Sai REST |

---

## 4. Phân Trang, Lọc & Sắp Xếp (Pagination, Filter, Search, Sort)

### ⭐ Tốt:
- Các endpoint quản lý nâng cao như `ExamSet`, `User` hỗ trợ các tham số chuẩn: `page`, `limit`, `search`, `sortBy`, `sortOrder`.

### ❌ Thiếu Chuẩn Hóa Ở Nhiều Controller Khác:
- `/api/classes`: Trả về toàn bộ danh sách lớp học mà **không có phân trang mặc định**, gây rủi ro nghẽn bộ nhớ khi số lượng lớp học lên đến hàng ngàn.
- `/api/attendances`: Không phân trang danh sách bản ghi điểm danh.
- Không có giới hạn `limit` tối đa ở một số query custom (dễ bị exploit gửi `limit=999999` crash DB).

---

## 5. Xử Lý Upload File & Media Assets

- File upload được xử lý qua `upload.middlewares.js` tích hợp Cloudinary.
- **Vấn đề:** API upload file không trả về thông tin metadata chuẩn như `originalName`, `mimeType`, `fileSize`, mà chỉ trả về đường dẫn URL `secure_url`.

---

## 6. Bảng Đánh Giá Chi Tiết Danh Sách API (API Audit Table)

| Module | HTTP Method | Endpoint Path | Controller Handler | Trạng thái | Ghi chú Audit |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **Auth** | `POST` | `/api/auth/login` | `login` | ✔ Tốt | Đầy đủ validation. |
| **User** | `GET` | `/api/users` | `getAllUsers` | ✔ Tốt | Có phân trang, search, filter role. |
| **Lesson** | `GET` | `/api/lesson` | `getLessons` | ❌ Sai REST | Path số ít (`/lesson` thay vì `/lessons`). |
| **Lesson** | `POST` | `/api/lesson` | `createLesson` | ❌ Sai REST | Trả về status 200 thay vì 201 Created. |
| **ExamSet** | `POST` | `/api/exam-sets/:id/duplicate` | `duplicateExamSet` | ⚠ Chưa chuẩn | Dùng động từ trong URL path. |
| **Notification**| `GET` | `/api/notifications` | `AnnouncementController` | ❌ Sai REST | Trùng đè route với `NotificationRouter`. |

---

## 7. Khuyến Nghị Chuẩn Hóa API

1. Đổi toàn bộ đường dẫn số ít sang số nhiều: `/api/lesson` ➔ `/api/lessons`.
2. Áp dụng HTTP `201 Created` nhất quán cho toàn bộ các endpoint `POST` tạo mới tài nguyên.
3. Đưa cơ chế phân trang mặc định (`page=1`, `limit=20`, `maxLimit=100`) vào middleware toàn cục cho tất cả API danh sách.
