# Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirement Specification - SRS)

Tài liệu đặc tả toàn bộ yêu cầu chức năng (FR) và phi chức năng (NFR) cho dự án Hệ thống Quản lý Học tập AI-LMS.

---

## 📑 MỤC LỤC
1. [Giới thiệu Dự án & Phạm vi (Project Overview & Scope)](#1-giới-thiệu-dự-án--phạm-vi-project-overview--scope)
2. [Các Vai trò Người dùng (User Roles)](#2-các-vai-trò-người-dùng-user-roles)
3. [Phân hệ Chức năng Hệ thống (System Modules)](#3-phân-hệ-chức-năng-hệ-thống-system-modules)
4. [Yêu cầu Chức năng Chi tiết (Functional Requirements)](#4-yêu-cầu-chức-năng-chi-tiết-functional-requirements)
   - [4.1 Phân hệ Admin](#41-phân-hệ-admin)
   - [4.2 Phân hệ Teacher (Giảng viên)](#42-phân-hệ-teacher-giảng-viên)
   - [4.3 Phân hệ Student (Học sinh/Sinh viên)](#43-phân-hệ-student-học-sinhsinh-viên)
5. [Yêu cầu Phi Chức năng (Non-Functional Requirements)](#5-yêu-cầu-phi-chức-năng-non-functional-requirements)
6. [Quy tắc Nghiệp vụ (Business Rules)](#6-quy-tắc-nghiệp-vụ-business-rules)
7. [Giả định và Ràng buộc (Assumptions & Constraints)](#7-giả-định-và-ràng-buộc-assumptions--constraints)

---

## 1. GIỚI THIỆU DỰ ÁN & PHẠM VI (PROJECT OVERVIEW & SCOPE)

**AI-LMS** là giải pháp nền tảng học tập trực tuyến thông minh tích hợp trí tuệ nhân tạo, thiết kế phục vụ các trung tâm đào tạo, trường học và tổ chức giáo dục. Nền tảng quản lý toàn bộ vòng đời khóa học: từ quản lý tài khoản, tạo khóa học/lớp học, tổ chức bài giảng, giao bài tập, chấm điểm tự động bằng AI, tổ chức thi trắc nghiệm & giám sát gian lận (anti-cheat), cho đến báo cáo analytics tổng hợp tiến độ học tập của sinh viên.

---

## 2. CÁC VAI TRÒ NGƯỜI DÙNG (USER ROLES)

| Vai trò | Ký hiệu | Mô tả quyền hạn |
| :--- | :---: | :--- |
| **Admin** | `admin` | Quản trị viên tối cao: Quản lý tài khoản, danh mục khóa học, phân công giảng viên, cấu hình tham số AI và xem báo cáo tổng hợp toàn hệ thống. |
| **Teacher** | `teacher` | Giảng viên phụ trách: Quản lý lớp học được phân công, tạo bài giảng, ngân hàng câu hỏi, tạo bài thi, điểm danh, chấm bài tập và tổ chức các buổi học Live. |
| **Student** | `student` | Học sinh/Sinh viên: Nộp mã vào lớp, xem bài giảng, làm bài tập về nhà, tham gia thi trực tuyến, nhận phản hồi AI và theo dõi chỉ số năng lực học tập trên Dashboard. |

---

## 3. PHÂN HỆ CHỨC NĂNG HỆ THỐNG (SYSTEM MODULES)

1. **Auth & Identity Module**: Đăng ký, đăng nhập, bảo vệ tuyến đường bằng JWT và RBAC.
2. **User Management Module**: CRUD người dùng, khóa/mở khóa tài khoản.
3. **Course & Class Module**: Quản lý danh mục khóa học, tạo lớp học, phân công giảng viên, xếp học sinh.
4. **Learning & Assignment Module**: Quản lý bài giảng, tài liệu multimedia, giao bài tập và nộp bài tập.
5. **AI Examination Engine**: Ngân hàng câu hỏi, sinh đề thi chuẩn 10 điểm, giám sát gian lận thi.
6. **Attendance & Gradebook Module**: Điểm danh học sinh theo ngày, quản lý bảng điểm và tính GPA tự động.
7. **AI Tutor & Learning Analytics**: Phân tích chỉ số nguy cơ rủi ro học tập (High/Medium/Low Risk) và sinh gợi ý lộ trình cho từng sinh viên.

---

## 4. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### 4.1 Phân hệ Admin
- **FR-ADM-01**: Admin có thể xem tổng quan Dashboard số lượng User, Khóa học, Lớp học và doanh thu/lượt học.
- **FR-ADM-02**: Admin có quyền Tạo/Đọc/Sửa/Xóa (Soft Delete) tài khoản người dùng và gán vai trò (`admin`, `teacher`, `student`).
- **FR-ADM-03**: Admin có quyền Tạo/Đọc/Sửa/Xóa danh mục Khóa học và thiết lập thông số môn học.
- **FR-ADM-04**: Admin có thể mở Lớp học mới và Phân công Giảng viên phụ trách.
- **FR-ADM-05**: Admin có quyền truy cập màn hình Cấu hình AI Prompt & Quản lý AI Models.

### 4.2 Phân hệ Teacher (Giảng viên)
- **FR-TCH-01**: Giảng viên chỉ xem và quản lý danh sách các Lớp học do mình được phân công.
- **FR-TCH-02**: Giảng viên có thể tạo Bài giảng mới kèm file đính kèm/video Cloudinary.
- **FR-TCH-03**: Giảng viên có thể tạo Ngân hàng câu hỏi (MCQ / ESSAY) hoặc sử dụng nút "Sinh câu hỏi AI".
- **FR-TCH-04**: Giảng viên tạo Đề thi trực tuyến. Hệ thống tự động validate tổng điểm các câu hỏi phải bằng đúng `10.0`.
- **FR-TCH-05**: Giảng viên thực hiện điểm danh học sinh theo ngày (`Present`, `Absent`, `Late`, `Excused`).
- **FR-TCH-06**: Giảng viên chấm điểm bài tập tự luận của học sinh, có thể kích hoạt AI Auto-Grader để xem gợi ý nhận xét.

### 4.3 Phân hệ Student (Học sinh/Sinh viên)
- **FR-STU-01**: Học sinh có thể tham gia lớp học mới bằng cách nhập `joinCode` (Mã tham gia lớp).
- **FR-STU-02**: Học sinh truy cập Learning Progress Dashboard để xem Điểm Năng Lực Học Tập (Learning Score), GPA, Tỷ lệ chuyên cần và danh sách Bài tập/Đề thi sắp tới.
- **FR-STU-03**: Học sinh thực hiện nộp bài tập về nhà (hỗ trợ đính kèm tối đa 5 tệp bài làm).
- **FR-STU-04**: Học sinh làm bài thi trực tuyến. Hệ thống đếm ngược thời gian và tự động ghi nộp bài khi hết giờ.
- **FR-STU-05**: Hệ thống giám sát và ghi lại nhật ký gian lận thi (`TAB_SWITCH`, `FULLSCREEN_EXIT`, `COPY_PASTE`).

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 5.1 Hiệu năng (Performance)
- **NFR-PERF-01**: Thời gian phản hồi API (Response Time) phải dưới **300ms** cho 95% các yêu cầu thông thường.
- **NFR-PERF-02**: Màn hình Learning Progress Dashboard của Học sinh phải tải hoàn tất dữ liệu trong dưới **1.5 giây**.
- **NFR-PERF-03**: Hệ thống phải hỗ trợ tối thiểu **500 người dùng đồng thời (Concurrent Users)** khi thi trắc nghiệm mà không gặp nghẽn kết nối Database.

### 5.2 Bảo mật (Security)
- **NFR-SEC-01**: Tất cả mật khẩu người dùng phải được mã hóa bằng thuật toán `bcrypt` với muối (salt) tối thiểu 10 vòng mã hóa trước khi lưu trữ vào Database.
- **NFR-SEC-02**: Mọi truy cập API bắt buộc phải đi qua Middleware xác thực JWT (AccessToken có thời hạn 1 ngày).
- **NFR-SEC-03**: Áp dụng Enterprise Soft Delete Plugin để đảm bảo không mất dữ liệu thô khi thực hiện thao tác xóa.

### 5.3 Tính sẵn sàng & Tin cậy (Availability & Reliability)
- **NFR-AVAIL-01**: Hệ thống cam kết thời gian hoạt động (Uptime) đạt tối thiểu **99.5%**.
- **NFR-AVAIL-02**: Mọi ngoại lệ không mong muốn (Unhandled Exception) phải được bọc bởi Error Middleware và trả về JSON chuẩn, không làm sập tiến trình Node.js server.

---

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

- **BR-01**: Một Lớp học không được phép vượt quá số lượng `maxStudents` đã được cấu hình khi mở lớp.
- **BR-02**: Đề thi chỉ được phép mở cho học sinh làm bài khi thỏa mãn điều kiện `currentTime >= startTime` và tổng điểm các câu hỏi thành phần phải bằng chính xác **10.0 điểm**.
- **BR-03**: Mỗi học sinh chỉ được nộp duy nhất 1 bài làm (Submission) cho 1 bài tập (Assignment). Nếu nộp lại, bản nộp mới sẽ thay thế/cập nhật bản cũ.
- **BR-04**: Tài khoản bị đánh dấu xóa mềm (`isDeleted = true`) hoặc trạng thái `Inactive` / `Locked` sẽ bị chặn truy cập ngay tại bước đăng nhập với mã HTTP Status **403 Forbidden**.

---

## 7. GIẢ ĐỊNH VÀ RÀNG BUỘC (ASSUMPTIONS & CONSTRAINTS)

- **Assumptions**: Người dùng sử dụng các trình duyệt web hiện đại (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) có bật JavaScript.
- **Constraints**: Hệ thống phụ thuộc vào kết nối Internet ổn định và dịch vụ Cloudinary CDN để hiển thị tài liệu đính kèm.
