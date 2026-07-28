# 📊 Ma Trận Phân Quyền API Toàn Hệ Thống (RBAC Matrix)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Ký Hiệu & Quy Tắc Đánh Giá](#1-ký-hiệu--quy-tắc-đánh-giá)
2. [Ma Trận Phân Quyền Chi Tiết Theo Module API](#2-ma-trận-phân-quyền-chi-tiết-theo-module-api)
   - [2.1 Phân Hệ Xác Thực & Người Dùng (Auth & User)](#21-phân-hệ-xác-thực--người-dùng-auth--user)
   - [2.2 Phân Hệ Khóa Học & Lớp Học (Course & Class)](#22-phân-hệ-khóa-học--lớp-học-course--class)
   - [2.3 Phân Hệ Bài Học & Bài Tập (Lesson & Assignment)](#23-phân-hệ-bài-học--bài-tập-lesson--assignment)
   - [2.4 Phân Hệ Ngân Hàng Câu Hỏi & Đề Thi (Question & Exam)](#24-phân-hệ-ngân-hàng-câu-hỏi--đề-thi-question--exam)
   - [2.5 Phân Hệ Điểm Danh & Sổ Điểm (Attendance & Grade)](#25-phân-hệ-điểm-danh--sổ-điểm-attendance--grade)
   - [2.6 Phân Hệ Thông Báo & Phòng Học Live (Announcement & Live)](#26-phân-hệ-thông-báo--phòng-học-live-announcement--live)

---

## 1. Ký Hiệu & Quy Tắc Đánh Giá

- ✅ **Được phép (Allowed):** Được phép truy cập đúng theo yêu cầu nghiệp vụ.
- ❌ **Bị chặn (Blocked):** Bị từ chối truy cập đúng theo yêu cầu nghiệp vụ.
- ⚠ **Chưa kiểm tra đầy đủ:** Thiếu middleware hoặc thiếu owner check nhưng không gây hậu quả cực kỳ nghiêm trọng.
- 🔴 **Nguy cơ truy cập trái phép (Security Risk):** Tồn tại lỗ hổng IDOR hoặc hổng phân quyền.

---

## 2. Ma Trận Phân Quyền Chi Tiết Theo Module API

### 2.1 Phân Hệ Xác Thực & Người Dùng (Auth & User)

| API Endpoint | Method | Public | Admin | Teacher | Student | Middleware Hiện Tại | Kết Quả Audit | Ghi Chú |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| `/api/auth/login` | `POST` | ✅ | ❌ | ❌ | ❌ | `loginValidation` | ✅ | Công khai cho người dùng chưa đăng nhập. |
| `/api/users/me` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | ✅ | Xem profile cá nhân. |
| `/api/users/me` | `PUT` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | ✅ | Cập nhật profile cá nhân (không sửa được role). |
| `/api/users` | `GET` | ❌ | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | ✅ | Quản lý danh sách người dùng. |
| `/api/users` | `POST` | ❌ | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | ✅ | Tạo tài khoản người dùng mới. |
| `/api/users/:id` | `DELETE`| ❌ | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | ✅ | Soft delete tài khoản. |

### 2.2 Phân Hệ Khóa Học & Lớp Học (Course & Class)

| API Endpoint | Method | Public | Admin | Teacher | Student | Middleware Hiện Tại | Kết Quả Audit | Ghi Chú |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| `/api/courses` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | ✅ | Xem danh sách khóa học. |
| `/api/courses` | `POST` | ❌ | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | ✅ | Tạo mới khóa học. |
| `/api/classes` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | ⚠ | Học sinh thấy toàn bộ lớp học thay vì chỉ thấy lớp mình enrolled. |
| `/api/classes` | `POST` | ❌ | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | ✅ | Tạo lớp học mới. |
| `/api/classes/:id` | `DELETE`| ❌ | ✅ | ✅ (Owner) | ❌ | `verifyUser, isTeacher` | ✅ | Xóa lớp học (có check Teacher owner). |

### 2.3 Phân Hệ Bài Học & Bài Tập (Lesson & Assignment)

| API Endpoint | Method | Public | Admin | Teacher | Student | Middleware Hiện Tại | Kết Quả Audit | Ghi Chú |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| `/api/lesson` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | ⚠ | Đường dẫn bị lệch dạng số ít (`/api/lesson`). |
| `/api/lesson` | `POST` | ❌ | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | ✅ | Tạo bài học mới trong lớp. |
| `/api/assignments` | `POST` | ❌ | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | ✅ | Tạo bài tập mới. |
| `/api/assignments/:id/submissions` | `POST` | ❌ | ❌ | ❌ | ✅ | `verifyUser` | 🔴 | Thiếu kiểm tra enrollment của student trong lớp. |
| `/api/assignments/submissions/:id` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | 🔴 | **LỖ HỔNG IDOR:** Student A xem được submission của Student B. |

### 2.4 Phân Hệ Ngân Hàng Câu Hỏi & Đề Thi (Question & Exam)

| API Endpoint | Method | Public | Admin | Teacher | Student | Middleware Hiện Tại | Kết Quả Audit | Ghi Chú |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| `/api/questions` | `GET/POST`| ❌ | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | ✅ | Quản lý ngân hàng câu hỏi. |
| `/api/exams` | `POST` | ❌ | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | ✅ | Tạo bài thi mới. |
| `/api/exam-attempts/:id` | `GET` | ❌ | ✅ | ✅ | ✅ | `verifyUser` | 🔴 | **LỖ HỔNG IDOR:** Student xem được kết quả thi của bạn khác. |

---

## 3. Tổng Kết Đánh Giá Phân Quyền API

- ✅ Phân quyền giữa **Admin** và các vai trò khác được thực hiện rất chặt chẽ tại tầng Router (`isAdmin`).
- 🔴 Cần bổ sung ngay bước **Owner Check** tại Controller Layer cho các API lấy chi tiết `Submission` và `ExamAttempt` của Học sinh.
