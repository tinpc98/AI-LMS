# 🔄 Phân Tích & Đối Chiếu Tương Thích Frontend - Backend (Frontend Compatibility Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Tương Thích Frontend - Backend](#1-tổng-quan-tương-thích-frontend---backend)
2. [Bảng Đối Chiếu Khai Báo API Contract Giữa 2 Phân Hệ](#2-bảng-đối-chiếu-khai-báo-api-contract-giữa-2-phân-hệ)
3. [Phân Tích Bất Đồng Bộ Về Tên Trường (Field Naming Mismatch)](#3-phân-tích-bất-đồng-bộ-về-tên-trường-field-naming-mismatch)
4. [Bất Đồng Bộ Về HTTP Method & Route Paths](#4-bất-đồng-bộ-về-http-method--route-paths)
5. [Phân Loại Lỗi Thuộc Về Phía Backend Hay Frontend](#5-phân-loại-lỗi-thuộc-về-phía-backend-hay-frontend)
6. [Khuyến Nghị Đồng Bộ Hóa Toàn Diện](#6-khuyến-nghị-đồng-bộ-hóa-toàn-diện)

---

## 1. Tổng Quan Tương Thích Frontend - Backend

Một hệ thống web ứng dụng chạy mượt mà đòi hỏi sự kết nối hoàn hảo về API Endpoint URL, HTTP Method, Authentication Header và cấu trúc JSON Payload giữa Frontend (React/Vite) và Backend (Node/Express).

Bộ phận Audit đã thực hiện rà soát toàn bộ các câu lệnh gọi API (`axios`, `fetch`) trong thư mục `Frontend/` và đối chiếu trực tiếp với các Routers/Controllers trong `Backend/src/`.

---

## 2. Bảng Đối Chiếu Khai Báo API Contract Giữa 2 Phân Hệ

| Màn hình Frontend | Action / Feature | Endpoint Frontend Gọi | Endpoint Backend Khai Báo | Trạng Thái Kết Nối |
| :--- | :--- | :--- | :--- | :---: |
| **Login Page** | Đăng nhập | `POST /api/auth/login` | `POST /api/auth/login` | ✅ Khớp 100% |
| **Profile Page** | Lấy Profile | `GET /api/users/me` | `GET /api/auth/me` & `/api/users/me` | ✅ Khớp |
| **Lesson Page** | Lấy bài học | `GET /api/lessons` | `GET /api/lesson` | ❌ LỖI MISMATCH (Số nhiều vs Số ít) |
| **Notification**| Lấy thông báo | `GET /api/notifications` | Trùng đè Router (`Announcement` đè `Notification`) | ❌ LỖI BACKEND ROUTE |
| **ExamSet** | Nhân bản bộ đề | `POST /api/exam-sets/:id/duplicate` | `POST /api/exam-sets/:id/duplicate` | ✅ Khớp |
| **Assignment** | Nộp bài tập | `POST /api/assignments/:id/submit` | `POST /api/assignments/:id/submissions` | ❌ LỖI ROUTE MISMATCH |

---

## 3. Phân Tích Bất Đồng Bộ Về Tên Trường (Field Naming Mismatch)

### 🔴 LỖ HỔNG MISMATCH KHAI BÁO TÊN TRƯỜNG DỮ LIỆU:

1. **User Profile Data:**
   - **Backend trả về:** `data: { id: "xxx", fullName: "..." }`
   - **Frontend mong chờ:** `data: { _id: "xxx", name: "..." }` (Một số component Frontend cũ dùng `name` thay vì `fullName`).
2. **Pagination Metadata:**
   - **Backend (`examSet`):** trả về `{ currentPage, pageSize, totalItems }`.
   - **Frontend UI Pagination Component:** mong chờ `{ page, limit, total }`.
   - **Hậu quả:** Bảng danh sách bộ đề ở Frontend không hiển thị đúng số trang (hiển thị NaN/0).

---

## 4. Bất Đồng Bộ Về HTTP Method & Route Paths

1. **Lesson Endpoint:**
   - Frontend thực hiện call: `axios.get('/api/lessons?classId=xxx')`.
   - Backend [main.js:L85](file:///e:/AI-LMS/Backend/main.js#L85) lại đăng ký: `app.use("/api/lesson", LessonRouter)`.
   - **Kết quả:** Frontend nhận lỗi **HTTP 404 Not Found** khi truy cập trang bài học!

2. **Submission Endpoint:**
   - Frontend gửi: `POST /api/assignments/:id/submit`.
   - Backend Router lại khai báo: `POST /api/assignments/:id/submissions`.
   - **Kết quả:** Học sinh ấn nộp bài tập bị báo lỗi 404.

---

## 5. Phân Loại Lỗi Thuộc Về Phía Backend Hay Frontend

Theo nguyên tắc thiết kế RESTful chuẩn và nguyên tắc bảo tồn API Contract:

- **Lỗi Backend:**
  - Route bài học đăng ký sai dạng số ít `/api/lesson` ➔ **Lỗi Backend**. (Cần sửa Backend thành `/api/lessons`).
  - Route thông báo bị đăng ký đè `/api/notifications` trong `main.js` ➔ **Lỗi Backend**.
  - Trả về metadata phân trang không đồng nhất (`currentPage` vs `page`) ➔ **Lỗi Backend**.

- **Lỗi Frontend:**
  - Frontend gọi `POST /api/assignments/:id/submit` thay vì tuân theo RESTful resource collection `/submissions` ➔ **Lỗi Frontend** (hoặc Backend thêm alias route).

---

## 6. Khuyến Nghị Đồng Bộ Hóa Toàn Diện

1. Đổi route Backend `app.use("/api/lessons", LessonRouter)` để khớp với Frontend.
2. Thống nhất 100% Pagination Contract trả về `{ page, limit, total, totalPages }`.
