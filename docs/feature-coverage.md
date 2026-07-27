# BÁO CÁO MỨC ĐỘ BAO PHỦ TÍNH NĂNG (FEATURE COVERAGE REPORT)

Tài liệu này đánh giá mức độ phủ sóng của từng Tính năng chính trên cả 2 phương diện **Frontend UI** và **Backend API**.

---

## 📑 MỤC LỤC
1. [Bảng Ma Trận Bao Phủ Tính Năng (Feature Coverage Matrix)](#1-bảng-ma-trận-bao-phủ-tính-năng-feature-coverage-matrix)
2. [Chi tiết Phân tích Từng Nhóm Tính năng](#2-chi-tiết-phân-tích-từng-nhóm-tính-năng)

---

## 1. BẢNG MA TRẬN BAO PHỦ TÍNH NĂNG (FEATURE COVERAGE MATRIX)

| STT | Chức năng (Feature) | Frontend UI | Backend System | API Support | Mức độ Hoàn thiện |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **Đăng nhập & JWT Auth** | ✅ Có UI Login | ✅ Hash Password & JWT | `POST /api/auth/login` | ✅ Hoàn thiện (100%) |
| 2 | **Quản lý Tài khoản (User)** | ✅ Modal/Table | ✅ User Model & Soft Delete | `/api/users/*` | ✅ Hoàn thiện (100%) |
| 3 | **Quản lý Khóa học (Course)** | ✅ Modal/Table | ✅ Course Model & Service | `/api/courses/*` | ✅ Hoàn thiện (100%) |
| 4 | **Quản lý Lớp học (Class)** | ✅ UI Lớp | ✅ Class Model & Service | `/api/classes/*` | ✅ Hoàn thiện (100%) |
| 5 | **Phân công Giáo viên** | ✅ Select UI | ✅ Assign Teacher Logic | `PUT /api/classes/:id/assign-teacher` | ✅ Hoàn thiện (100%) |
| 6 | **Bài giảng & File (Lesson)** | ✅ Video/File View | ✅ Multer Cloudinary | `/api/lesson/*` | ✅ Hoàn thiện (100%) |
| 7 | **Bài tập (Assignment)** | ✅ Submit Form | ✅ Submission Model | `/api/assignments/*` | ✅ Hoàn thiện (100%) |
| 8 | **Thi trực tuyến (Exam & Proctor)**| ✅ Exam Screen | ✅ Socket.io Real-time Cheat | `/api/exams/*`, `/api/exam-attempts/*` | ✅ Hoàn thiện (95%) |
| 9 | **Ngân hàng câu hỏi (Question)** | ✅ Form & Import | ✅ XLSX Parser Buffer | `/api/questions/*` | ✅ Hoàn thiện (100%) |
| 10 | **Điểm danh (Attendance)** | ✅ Table/Timeline | ✅ Stats Service | `/api/attendances/*` | ✅ Hoàn thiện (95%) |
| 11 | **Bảng điểm & GPA (Grade)** | ✅ Table/Summary | ✅ Weighted GPA Calculator | `/api/grades/*` | ✅ Hoàn thiện (95%) |
| 12 | **Thông báo (Notification)** | ✅ Feed/Header Drawer| ✅ Read / Read All Patch | `/api/announcements/*`, `/api/notifications/*` | ✅ Hoàn thiện (95%) |
| 13 | **Lớp học Live (8x8 JaaS)** | ✅ Jitsi Iframe | ✅ RSA256 JWT Token Signer | `/api/live/*` | ✅ Hoàn thiện (95%) |
| 14 | **Dashboard Stats** | ✅ Biểu đồ / Stats | 🟡 Tự đếm ở Client | 🟡 Dùng chung `/api/users`, `classes`, `courses` | 🟡 Đang phát triển (70%) |
| 15 | **AI Sinh đề thi Matrix** | ✅ Form Ma trận | 🟡 Bốc ngẫu nhiên $sample DB | `POST /api/exams/generate-auto` | 🟡 Đang phát triển (75%) |
| 16 | **AI Chatbot Trợ lý** | 🔴 Chưa có Component | 🔴 Chưa có API | 🔴 Chưa có API | 🔴 Chưa có (0%) |
| 17 | **AI Summary Nội dung** | 🔴 Chưa có Component | 🔴 Chưa có API | 🔴 Chưa có API | 🔴 Chưa có (0%) |
| 18 | **Tiến độ Học tập % (Progress)** | 🔴 Chưa có Component | 🔴 Chưa có API | 🔴 Chưa có API | 🔴 Chưa có (0%) |
| 19 | **Quản lý AI (AI Config)** | 🟡 Dùng Mock UI | 🔴 Chưa có API | 🔴 Chưa có API | 🟡 Đang phát triển (30%) |
| 20 | **Báo cáo Báo chí (Report)** | 🟡 Dùng Mock UI | 🔴 Chưa có API | 🔴 Chưa có API | 🟡 Đang phát triển (30%) |

---

## 2. CHI TIẾT PHÂN TÍCH TỪNG NHÓM TÍNH NĂNG

1. **Nhóm Tính năng Đã Hoàn thiện (13 Features - ✅)**:
   Xác thực JWT, User, Course, Class, Teacher Assignment, Lesson, Assignment, Exam & Proctoring, Question Bank & Excel, Attendance, Grade & GPA, Notification, Live Session JaaS. Tất cả 13 tính năng này đã có giao diện người dùng đẹp mắt và kết nối Backend API thực tế lưu DB.

2. **Nhóm Tính năng Đang Phát triển / Cần Refactor (3 Features - 🟡)**:
   - **Dashboard Stats**: Frontend đang gọi các API danh sách rồi tự đếm ở Client.
   - **AI Management & Report**: Frontend đã dựng sẵn UI mẫu nhưng đang dùng dữ liệu Mock (`features.mock.ts`).
   - **AI Sinh đề thi Matrix**: Backend mới triển khai thuật toán ngẫu nhiên cơ sở dữ liệu, chưa kết nối LLM.

3. **Nhóm Tính năng Chưa Có (4 Features - 🔴)**:
   AI Chatbot, AI Summary, Tiến độ học tập %, Xuất báo cáo Excel/PDF.
