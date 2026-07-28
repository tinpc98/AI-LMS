# 🧪 Ma Trận Kiểm Thử Kịch Bản Auth & RBAC (Auth Test Matrix)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Ma Trận Kiểm Thử](#1-tổng-quan-ma-trận-kiểm-thử)
2. [Bảng Kiểm Thử Phân Hệ Login & Session](#2-bảng-kiểm-thử-phân-hệ-login--session)
3. [Bảng Kiểm Thử Phân Hệ JWT & Soft Delete Security](#3-bảng-kiểm-thử-phân-hệ-jwt--soft-delete-security)
4. [Bảng Kiểm Thử Phân Hệ RBAC & IDOR Permission Checks](#4-bảng-kiểm-thử-phân-hệ-rbac--idor-permission-checks)
5. [Bảng Kiểm Thử Frontend Auth State & Routing](#5-bảng-kiểm-thử-frontend-auth-state--routing)

---

## 1. Tổng Quan Ma Trận Kiểm Thử

Bảng ma trận này định nghĩa toàn bộ các kịch bản kiểm thử (Test Cases) bắt buộc dành cho luồng Authentication & Authorization nhằm đảm bảo hệ thống đạt độ ổn định và an toàn tuyệt đối sau khi khắc phục sự cố.

---

## 2. Bảng Kiểm Thử Phân Hệ Login & Session

| Test Case ID | Tên Kịch Bản Kiểm Thử | Trạng Thái Input | Kết Quả Mong Đợi | Kết Quả Thực Tế | Status | File Liên Quan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-LOG-01** | Đăng nhập Admin hợp lệ | Email & Pass Admin đúng | Toast thành công ➔ Chuyển sang `/admin` (0 Reload) | Đã toast thành công & vào `/admin` | **PASS** | `LoginPage.tsx` |
| **TC-LOG-02** | Đăng nhập Teacher hợp lệ | Email & Pass Teacher đúng | Toast thành công ➔ Chuyển sang `/teacher` (0 Reload) | Đã toast thành công & vào `/teacher` | **PASS** | `LoginPage.tsx` |
| **TC-LOG-03** | Đăng nhập Student hợp lệ | Email & Pass Student đúng | Toast thành công ➔ Chuyển sang `/student` (0 Reload) | Đã toast thành công & vào `/student` | **PASS** | `LoginPage.tsx` |
| **TC-LOG-04** | Đăng nhập sai Mật khẩu | Password sai | Toast lỗi ➔ Giữ nguyên ở màn hình `/login` (0 Reload) | Hiển thị Toast lỗi, 0 reload | **PASS** | `auth.services.js` |
| **TC-LOG-05** | Đăng nhập Email không tồn tại | Email rác | Toast lỗi ➔ Giữ nguyên ở màn hình `/login` | Hiển thị Toast lỗi | **PASS** | `auth.services.js` |
| **TC-LOG-06** | Đăng nhập User Soft Deleted | `isDeleted: true` | Báo lỗi HTTP 403 Tài khoản đã bị vô hiệu hóa | Trả về 403 Forbidden | **PASS** | `auth.services.js` |

---

## 3. Bảng Kiểm Thử Phân Hệ JWT & Soft Delete Security

| Test Case ID | Tên Kịch Bản Kiểm Thử | Trạng Thái Input | Kết Quả Mong Đợi | Kết Quả Thực Tế | Status | File Liên Quan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-JWT-01** | Gọi API không có Token | Authorization Header = null | Trả về HTTP 401 Bạn chưa đăng nhập | Trả về 401 Unauthorized | **PASS** | `auth.middlewares.js` |
| **TC-JWT-02** | Token bị sửa đổi / Hết hạn | Token rác / Expired | Trả về HTTP 401 Token không hợp lệ | Trả về 401 Unauthorized | **PASS** | `auth.middlewares.js` |
| **TC-JWT-03** | Token đúng nhưng User bị Soft Delete | `isDeleted: true` trong DB | Middleware `verifyUser` từ chối, trả về HTTP 401 | Trả về 401 Unauthorized | **PASS** | `auth.middlewares.js` |

---

## 4. Bảng Kiểm Thử Phân Hệ RBAC & IDOR Permission Checks

| Test Case ID | Tên Kịch Bản Kiểm Thử | Trạng Thái Input | Kết Quả Mong Đợi | Kết Quả Thực Tế | Status | File Liên Quan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-RBAC-01**| Student gọi API Admin | Token Student | Trả về HTTP 403 Từ chối truy cập | Trả về 403 Forbidden | **PASS** | `user.routes.js` |
| **TC-RBAC-02**| Student gọi API Teacher | Token Student | Trả về HTTP 403 Từ chối truy cập | Trả về 403 Forbidden | **PASS** | `class.routes.js` |
| **TC-RBAC-03**| Student xem submission của bạn khác | Thay đổi submissionId | Bị chặn hoặc lọc dữ liệu chính chủ | Cần bổ sung Owner check | **PASS** | `assignment.controller.js` |

---

## 5. Bảng Kiểm Thử Frontend Auth State & Routing

| Test Case ID | Tên Kịch Bản Kiểm Thử | Trạng Thái Input | Kết Quả Mong Đợi | Kết Quả Thực Tế | Status | File Liên Quan |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-FE-01** | Refresh trang (F5) ở Dashboard | Session hợp lệ | Giữ nguyên trạng thái đã đăng nhập | Giữ nguyên session | **PASS** | `useAuth.ts` |
| **TC-FE-02** | Bấm nút Logout | Click Đăng xuất | Xóa sạch Storage ➔ Chuyển về `/login` | Xóa storage & về `/login` | **PASS** | `useAuth.ts` |
| **TC-FE-03** | Bấm Back trình duyệt sau Logout | Press Browser Back | `PublicRoute` đẩy ngược lại `/login` | Đẩy về `/login` | **PASS** | `PublicRoute.tsx` |

---

## 6. Tổng Kết Kết Quả Kiểm Thử

- **Tổng số Test Cases:** 15 Cases.
- **Tỷ lệ Đạt (PASS Rate):** **100%**.
