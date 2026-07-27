# ĐỐI CHIẾU BUSINESS FLOW VỚI API BACKEND (BUSINESS FLOW API MAPPING)

Tài liệu này đối chiếu toàn bộ các tính năng theo luồng nghiệp vụ chuẩn của 3 nhóm người dùng (Admin, Teacher, Student) với hạ tầng API Backend hiện tại.

---

## 📑 MỤC LỤC
1. [Luồng Nghiệp Vụ ADMIN (Administrator Flow)](#1-luồng-nghiệp-vụ-admin-administrator-flow)
2. [Luồng Nghiệp Vụ TEACHER (Teacher Flow)](#2-luồng-nghiệp-vụ-teacher-teacher-flow)
3. [Luồng Nghiệp Vụ STUDENT (Student Flow)](#3-luồng-nghiệp-vụ-student-student-flow)
4. [Tổng kết Tỷ lệ Đáp ứng Nghiệp vụ](#4-tổng-kết-tỷ-lệ-đáp-ứng-nghiệp-vụ)

---

## 1. LUỒNG NGHIỆP VỤ ADMIN (ADMINISTRATOR FLOW)

| Chức năng Nghiệp vụ | API Backend Tương ứng | Đã có | Thiếu | Ghi chú & Đánh giá |
| :--- | :--- | :---: | :---: | :--- |
| **Đăng nhập** | `POST /api/auth/login` | ✅ | | Đầy đủ JWT authentication & validation |
| **Dashboard Admin** | `GET /api/users`, `GET /api/classes`, `GET /api/courses` | 🟡 | ❌ | Thiếu API tổng hợp thống kê riêng `/api/admin/dashboard-stats` |
| **Quản lý tài khoản** | `GET/POST/PUT/DELETE /api/users` | ✅ | | Đầy đủ CRUD + Enterprise Soft Delete |
| **Quản lý khóa học** | `GET/POST/PUT/DELETE /api/courses` | ✅ | | Đầy đủ CRUD khóa học |
| **Quản lý lớp học** | `GET/POST/PUT/DELETE /api/classes` | ✅ | | Đầy đủ CRUD lớp học |
| **Phân công giáo viên** | `PUT /api/classes/:id/assign-teacher` | ✅ | | Phân công teacherId cho lớp học |
| **Thêm/Xóa học sinh vào lớp**| `POST/DELETE /api/classes/:id/students` | ✅ | | Quản lý danh sách sinh viên trong lớp |
| **Quản lý AI** | - | | ❌ | **Thiếu hoàn toàn API Backend** (Cấu hình Model, API Key, Prompt Template) |
| **Báo cáo hệ thống** | - | | ❌ | **Thiếu API Backend** (Xuất báo cáo PDF/Excel, biểu đồ tăng trưởng) |
| **Quản lý hệ thống (System Config)** | - | | ❌ | **Thiếu API Backend** (Cấu hình tham số hệ thống, email SMTP, storage quota) |

---

## 2. LUỒNG NGHIỆP VỤ TEACHER (TEACHER FLOW)

| Chức năng Nghiệp vụ | API Backend Tương ứng | Đã có | Thiếu | Ghi chú & Đánh giá |
| :--- | :--- | :---: | :---: | :--- |
| **Đăng nhập** | `POST /api/auth/login` | ✅ | | Đăng nhập tài khoản Giáo viên |
| **Dashboard Giáo viên** | `GET /api/classes` | 🟡 | ❌ | Thiếu API thống kê nhanh công việc (bài nộp chưa chấm, ca thi sắp tới) |
| **Quản lý lớp được phân công**| `GET /api/classes`, `GET /api/classes/:id` | ✅ | | Xem thông tin chi tiết lớp phụ trách |
| **Upload bài giảng** | `POST/PUT/DELETE /api/lesson` | ✅ | | Tải lên tài liệu đính kèm (Cloudinary max 5 files) |
| **Quản lý tài liệu lớp** | `POST/DELETE /api/classes/:id/resources` | ✅ | | Quản lý tài nguyên đính kèm trực tiếp vào lớp học |
| **AI Summary bài giảng** | - | | ❌ | **Thiếu API Backend** (Gọi LLM tóm tắt video/bài giảng) |
| **AI sinh câu hỏi** | - | | ❌ | **Thiếu API Backend** (Gọi LLM sinh câu hỏi từ tài liệu) |
| **AI sinh đề thi tự động** | `POST /api/exams/generate-auto` | 🟡 | | Đã có API bốc ngẫu nhiên theo ma trận đề, chưa kết nối LLM |
| **Quản lý bài tập** | `GET/POST/PUT/DELETE /api/assignments` | ✅ | | Đầy đủ giao bài tập và tải file đề bài |
| **Quản lý kỳ thi & Đề thi** | `GET/POST/PUT/DELETE /api/exams` | ✅ | | Quản lý đề thi trắc nghiệm & tự luận |
| **Quản lý Ngân hàng câu hỏi**| `GET/POST/PUT/DELETE /api/questions`, `POST /api/questions/import-excel` | ✅ | | Đầy đủ CRUD + Import Excel |
| **Chấm điểm bài tập** | `PUT /api/assignments/grade/:submissionId` | ✅ | | Nhập điểm và nhận xét cho bài nộp |
| **Chấm điểm thi tự luận** | `PUT /api/exam-attempts/:id/grade-essay` | ✅ | | Chấm điểm tự luận cho lượt thi sinh viên |
| **Theo dõi tiến độ học tập** | `GET /api/grades/class/:classId` | 🟡 | ❌ | Mới xem được bảng điểm, chưa có API tiến độ % hoàn thành |
| **Điểm danh** | `POST/PUT /api/attendances`, `GET /api/attendances/stats/class/:id` | ✅ | | Điểm danh theo ngày và thống kê tỷ lệ vắng/có mặt |
| **Lớp học online (JaaS/Meet)**| `POST /api/live/create`, `end`, `jaas-token` | ✅ | | Tích hợp 8x8 JaaS Jitsi SDK với JWT mã hóa RSA256 |
| **Gửi thông báo** | `POST/PUT/DELETE /api/announcements` | ✅ | | Tạo thông báo phạm vi Lớp / Khóa / Hệ thống |

---

## 3. LUỒNG NGHIỆP VỤ STUDENT (STUDENT FLOW)

| Chức năng Nghiệp vụ | API Backend Tương ứng | Đã có | Thiếu | Ghi chú & Đánh giá |
| :--- | :--- | :---: | :---: | :--- |
| **Đăng nhập** | `POST /api/auth/login` | ✅ | | Đăng nhập tài khoản Học sinh |
| **Dashboard Học sinh** | `GET /api/classes` | 🟡 | ❌ | Thiếu API tổng hợp Widgets (Hạn nộp bài tập, điểm trung bình) |
| **Xem lớp học** | `GET /api/classes`, `GET /api/classes/:id` | ✅ | | Xem thông tin lớp học và học viên cùng lớp |
| **Xem bài giảng** | `GET /api/lesson/class/:classId` | ✅ | | Xem bài giảng và xem/tải tệp đính kèm |
| **AI Chatbot trợ lý học tập** | - | | ❌ | **Thiếu hoàn toàn API Backend** (Stream chat với AI) |
| **AI Summary nội dung** | - | | ❌ | **Thiếu API Backend** |
| **Làm & Nộp bài tập** | `POST/DELETE /api/assignments/submit/:id` | ✅ | | Nộp file bài làm, sửa bài nộp, hủy nộp bài |
| **Thi trực tuyến real-time** | `POST /api/exam-attempts/start`, `submit`, `warning` | ✅ | | Thi trắc nghiệm + tự luận, chống gian lận Socket.io |
| **Xem điểm cá nhân** | `GET /api/grades/student/:studentId`, `GET /api/grades/gpa/...` | ✅ | | Xem điểm thành phần và tổng kết GPA |
| **Xem tiến độ học tập** | - | | ❌ | **Thiếu API Backend** (Tính % hoàn thành khóa học/bài giảng) |
| **Nhận thông báo** | `GET /api/announcements`, `PATCH /api/notifications/...` | ✅ | | Đọc thông báo và đánh dấu đã đọc |

---

## 4. TỔNG KẾT TỶ LỆ ĐÁP ỨNG NGHIỆP VỤ

- **ADMIN**: Đáp ứng **65%** nghiệp vụ (Thiếu Dashboard stats API, Quản lý AI API, Report Export API, System Config API).
- **TEACHER**: Đáp ứng **85%** nghiệp vụ (Đầy đủ Lớp, Bài giảng, Bài tập, Thi cử, Điểm danh, Live JaaS. Thiếu AI Summary, AI Question Gen).
- **STUDENT**: Đáp ứng **75%** nghiệp vụ (Đầy đủ Xem lớp, Học bài giảng, Nộp bài tập, Thi online, Xem điểm. Thiếu AI Chatbot, AI Summary, Tiến độ học tập %).
