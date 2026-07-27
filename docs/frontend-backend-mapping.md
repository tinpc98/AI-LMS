# ÁNH XẠ GIỮA FRONTEND VÀ BACKEND (FRONTEND ↔ BACKEND MAPPING)

Tài liệu này đối chiếu chi tiết 100% các Trang (Pages) và Tuyến đường (Routes) của Frontend với các API Endpoints, Controllers, và Services trên Backend.

---

## 📑 MỤC LỤC
1. [Bảng Ánh xạ Toàn bộ Trang Frontend ↔ Backend APIs](#1-bảng-ánh-xạ-toàn-bộ-trang-frontend--backend-apis)
2. [Phân tích Chi tiết Tình trạng Tích hợp](#2-phân-tích-chi-tiết-tình-trạng-tích-hợp)
   - [2.1 Các Trang Đã Kết Nối API Backend Hoàn Hảo (✅)](#21-các-trang-đã-kết-nối-api-backend-hoàn-hảo-)
   - [2.2 Các Trang Đang Dùng Partial API & Local Calculation (🟡)](#22-các-trang-đang-dùng-partial-api--local-calculation-)
   - [2.3 Các Trang Đang Dùng 100% Mock Data - Chưa có Backend API (❌)](#23-các-trang-đang-dùng-100-mock-data---chưa-có-backend-api-)
3. [Tổng hợp Bất cập Gọi API ở Frontend](#3-tổng-hợp-bất-cập-gọi-api-ở-frontend)

---

## 1. BẢNG ÁNH XẠ TOÀN BỘ TRANG FRONTEND ↔ BACKEND APIS

| Trang Frontend (Route) | Component Primary | API Endpoint Gọi | Controller Handling | Service Handling | Trạng thái Tích hợp |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`/login`** | `LoginPage` | `POST /api/auth/login` | `auth.controllers.js` | `auth.services.js` | ✅ OK |
| **`/student/dashboard`** | `HomePageStudent` | `GET /api/classes`, `GET /api/announcements` | `class.controller.js`, `announcement.controller.js` | Direct Model & Service | ✅ OK |
| **`/student/myclasses`** | `MyClasses` | `GET /api/classes` | `class.controller.js` | Direct Model | ✅ OK |
| **`/student/classdetail/:id`** | `ClassDetail` | `GET /api/classes/:id`, `GET /api/lesson/class/:id`, `GET /api/assignments/class/:id`, `GET /api/exams/class/:id`, `GET /api/attendances/student/:id`, `GET /api/grades/student/:id`, `GET /api/live/active/:id` | Multiple Controllers | Multiple Services | ✅ OK |
| **`/student/studentassignment`** | `StudentAssignment` | `GET /api/assignments/class/:classId`, `POST/DELETE /api/assignments/submit/:id` | `assignment.controller.js` | Direct Model | ✅ OK |
| **`/student/lessonview`** | `LessonView` | `GET /api/lesson/class/:classId` | `lesson.controller.js` | Direct Model | ✅ OK |
| **`/student/notifications`** | `NotificationCenterPage` | `GET /api/notifications`, `PATCH /api/notifications/*/read` | `announcement.controller.js` | `announcement.service.js` | ✅ OK (có mock fallback) |
| **`/exam/:attemptId`** | `ExamPage` | `POST /api/exam-attempts/start`, `POST /:id/submit`, `GET /:id`, `POST /:id/warning` | `examAttempt.controller.js` | `examAttempt.service.js` | ✅ OK |
| **`/teacher`** | `HomePageTeacher` | `GET /api/classes`, `GET /api/assignments/class/:id`, `GET /api/live/active/:id` | `class.controller.js`, `assignment.controller.js` | Direct Model | ✅ OK |
| **`/teacher/classes`** | `ClassroomManagement` | `GET /api/classes` | `class.controller.js` | Direct Model | ✅ OK |
| **`/teacher/classroom-detail/:id`**| `ClassroomDetail` | `POST/PUT/DELETE /api/lesson`, `POST/PUT/DELETE /api/assignments`, `POST/PUT /api/attendances`, `POST/POST /api/live/create/end` | Multiple Controllers | Multiple Services | ✅ OK |
| **`/teacher/questionbank`** | `QuestionBank` | `GET/POST/PUT/DELETE /api/questions`, `POST /api/questions/import-excel` | `question.controller.js` | `question.service.js` | ✅ OK |
| **`/teacher/examresults/:examId`**| `ExamResults` | `GET /api/exam-attempts/exam/:examId` | `examAttempt.controller.js` | `examAttempt.service.js` | ✅ OK |
| **`/teacher/exam-review/:attemptId`**| `ExamAttemptDetail` | `GET /api/exam-attempts/:id/review`, `POST /api/exam-attempts/:id/grade-essay` | `examAttempt.controller.js` | `examAttempt.service.js` | ⚠ Lệch Method POST vs PUT |
| **`/admin`** | `DashboardPage` | `GET /api/users`, `GET /api/classes`, `GET /api/courses` | `auth.controllers.js`, `class.controller.js`, `course.controller.js` | Direct Model & Service | 🟡 Client tự tính stats |
| **`/admin/accounts`** | `AccountManagementPage` | `GET/POST/PUT/DELETE /api/users` | `auth.controllers.js` | `auth.services.js` | ✅ OK |
| **`/admin/courses`** | `CourseManagementPage` | `GET/POST/PUT/DELETE /api/courses` | `course.controller.js` | `course.service.js` | ✅ OK |
| **`/admin/classes`** | `ClassManagementPage` | `GET/POST/PUT/DELETE /api/classes`, `POST/DELETE /api/classes/:id/students` | `class.controller.js` | Direct Model | ✅ OK |
| **`/admin/teacher-assignment`** | `TeacherAssignmentPage` | `GET /api/classes`, `PUT /api/classes/:id/assign-teacher` | `class.controller.js` | Direct Model | ✅ OK |
| **`/admin/ai-management`** | `AIManagementPage` | - (Đang dùng Mock Data `mockAIFeatures`, `mockPromptTemplates`) | - | - | ❌ Chưa có Backend API |
| **`/admin/reports`** | `ReportPage` | - (Đang dùng Mock Data `mockAIFeatures`, `mockMonthlyUsage`) | - | - | ❌ Chưa có Backend API |
| **`/admin/profile`** | `ProfilePage` | `GET /api/auth/me`, `PUT /api/auth/me` | `auth.controllers.js` | Direct Model | ✅ OK |
| **`/admin/system`** | `AdminPage` | - (Giao diện tĩnh Cấu hình hệ thống) | - | - | ❌ Chưa có Backend API |

---

## 2. PHÂN TÍCH CHI TIẾT TÌNH TRẠNG TÍCH HỢP

### 2.1 Các Trang Đã Kết Nối API Backend Hoàn Hảo (✅)
17/23 trang Frontend đã kết nối thực sự với Backend API và lưu trữ thành công vào Database:
Login, Student Dashboard, MyClasses, ClassDetail, StudentAssignment, LessonView, NotificationCenterPage, ExamPage, Teacher Dashboard, ClassroomManagement, ClassroomDetail, QuestionBank, ExamResults, AccountManagementPage, CourseManagementPage, ClassManagementPage, TeacherAssignmentPage, ProfilePage.

### 2.2 Các Trang Đang Dùng Partial API & Local Calculation (🟡)
- **`DashboardPage` (/admin)**: Đang gọi `GET /api/users`, `GET /api/classes`, `GET /api/courses` rồi tự dùng JavaScript `.length` và `.filter()` để đếm số liệu Dashboard thay vì gọi API chuyên dụng.

### 2.3 Các Trang Đang Dùng 100% Mock Data - Chưa có Backend API (❌)
- **`AIManagementPage` (/admin/ai-management)**: Hiển thị danh sách AI Models và Prompt Templates từ file mock `features.mock.ts`.
- **`ReportPage` (/admin/reports)**: Hiển thị biểu đồ sử dụng AI và báo cáo từ file mock `features.mock.ts`.
- **`AdminPage` (/admin/system)**: Giao diện tĩnh để cấu hình tham số hệ thống.

---

## 3. TỔNG HỢP BẤT CẬP GỌI API Ở FRONTEND

1. **Lệch Method Chấm tự luận**: `ExamAttemptDetail.tsx` gọi `POST /api/exam-attempts/:id/grade-essay`, trong khi Backend `examAttempt.routes.js` đang dùng `PUT`.
2. **Lệch Route Sinh đề thi AI**: Component `CreateExamWizardDrawer.tsx` gọi `POST /api/exams/auto-generate`, trong khi Backend `exam.routes.js` đang đặt route là `/api/exams/generate-auto`.
