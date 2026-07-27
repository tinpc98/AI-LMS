# DANH MỤC TOÀN BỘ API (API REFERENCE)

Tài liệu này tổng hợp toàn bộ 53 Endpoints đang hoạt động trên hệ thống Backend AI LMS, phân loại theo 12 Router Modules.

---

## 📑 MỤC LỤC
1. [Bảng Tổng hợp Tất cả API](#1-bảng-tổng-hợp-tất-cả-api)
2. [Chi tiết API Module 1: Auth & User Management](#2-chi-tiết-api-module-1-auth--user-management)
3. [Chi tiết API Module 2: Class Management](#3-chi-tiết-api-module-2-class-management)
4. [Chi tiết API Module 3: Course Management](#4-chi-tiết-api-module-3-course-management)
5. [Chi tiết API Module 4: Lesson Management](#5-chi-tiết-api-module-4-lesson-management)
6. [Chi tiết API Module 5: Assignment & Submission](#6-chi-tiết-api-module-5-assignment--submission)
7. [Chi tiết API Module 6: Attendance Management](#7-chi-tiết-api-module-6-attendance-management)
8. [Chi tiết API Module 7: Grade Management](#8-chi-tiết-api-module-7-grade-management)
9. [Chi tiết API Module 8: Announcement & Notification](#9-chi-tiết-api-module-8-announcement--notification)
10. [Chi tiết API Module 9: Question Bank](#10-chi-tiết-api-module-9-question-bank)
11. [Chi tiết API Module 10: Exam Management](#11-chi-tiết-api-module-10-exam-management)
12. [Chi tiết API Module 11: Exam Attempt & Proctoring](#12-chi-tiết-api-module-11-exam-attempt--proctoring)
13. [Chi tiết API Module 12: Live Session & 8x8 JaaS](#13-chi-tiết-api-module-12-live-session--8x8-jaas)

---

## 1. BẢNG TỔNG HỢP TẤT CẢ API

| STT | Method | URL Endpoint | Controller | Service | Middleware | Quyền | Chức năng |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | POST | `/api/auth/login` | `auth.controllers.js` | `auth.services.js` | `loginValidation` | Public | Đăng nhập hệ thống |
| 2 | GET | `/api/auth/me` | `auth.controllers.js` | Direct Model | `verifyUser` | All | Lấy thông tin cá nhân |
| 3 | PUT | `/api/auth/me` | `auth.controllers.js` | Direct Model | `verifyUser` | All | Cập nhật hồ sơ cá nhân |
| 4 | GET | `/api/users` | `auth.controllers.js` | Direct Model | `verifyUser, isAdmin` | Admin | Lấy danh sách người dùng |
| 5 | POST | `/api/users` | `auth.controllers.js` | Direct Model | `verifyUser, isAdmin` | Admin | Tạo tài khoản mới |
| 6 | GET | `/api/users/:id` | `auth.controllers.js` | Direct Model | `verifyUser, isAdmin` | Admin | Lấy chi tiết tài khoản |
| 7 | PUT | `/api/users/:id` | `auth.controllers.js` | Direct Model | `verifyUser, isAdmin` | Admin | Cập nhật tài khoản |
| 8 | DELETE | `/api/users/:id` | `auth.controllers.js` | Direct Model | `verifyUser, isAdmin` | Admin | Xóa mềm tài khoản |
| 9 | GET | `/api/classes` | `class.controller.js` | Direct Model | `verifyUser` | All | Lấy danh sách lớp học |
| 10 | GET | `/api/classes/:id` | `class.controller.js` | Direct Model | `verifyUser` | All | Lấy chi tiết lớp học |
| 11 | POST | `/api/classes/:id/resources` | `class.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Thêm tài nguyên lớp |
| 12 | DELETE | `/api/classes/:id/resources/:resourceId` | `class.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Xóa tài nguyên lớp |
| 13 | POST | `/api/classes` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Tạo lớp học mới |
| 14 | PUT | `/api/classes/:id` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Cập nhật lớp học |
| 15 | PUT | `/api/classes/:id/assign-teacher` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Phân công giáo viên |
| 16 | POST | `/api/classes/:id/students` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Thêm học sinh vào lớp |
| 17 | DELETE | `/api/classes/:id/students/:studentId` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Xóa học sinh khỏi lớp |
| 18 | DELETE | `/api/classes/:id` | `class.controller.js` | Direct Model | `verifyUser, isAdmin` | Admin | Xóa mềm lớp học |
| 19 | GET | `/api/courses` | `course.controller.js` | `course.service.js` | `verifyUser` | All | Lấy danh sách khóa học |
| 20 | GET | `/api/courses/:id` | `course.controller.js` | `course.service.js` | `verifyUser` | All | Lấy chi tiết khóa học |
| 21 | POST | `/api/courses` | `course.controller.js` | `course.service.js` | `verifyUser, isAdmin` | Admin | Tạo khóa học mới |
| 22 | PUT | `/api/courses/:id` | `course.controller.js` | `course.service.js` | `verifyUser, isAdmin` | Admin | Cập nhật khóa học |
| 23 | DELETE | `/api/courses/:id` | `course.controller.js` | `course.service.js` | `verifyUser, isAdmin` | Admin | Xóa khóa học |
| 24 | POST | `/api/lesson` | `lesson.controller.js` | Direct Model | `verifyUser, isTeacher, upload` | Teacher/Admin | Tạo bài giảng + tệp |
| 25 | GET | `/api/lesson/class/:classId` | `lesson.controller.js` | Direct Model | `verifyUser` | All | Xem danh sách bài giảng |
| 26 | PUT | `/api/lesson/:id` | `lesson.controller.js` | Direct Model | `verifyUser, isTeacher, upload` | Teacher/Admin | Cập nhật bài giảng |
| 27 | DELETE | `/api/lesson/:id` | `lesson.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Xóa bài giảng |
| 28 | POST | `/api/assignments` | `assignment.controller.js` | Direct Model | `verifyUser, isTeacher, upload` | Teacher/Admin | Tạo bài tập |
| 29 | PUT | `/api/assignments/:id` | `assignment.controller.js` | Direct Model | `verifyUser, isTeacher, upload` | Teacher/Admin | Cập nhật bài tập |
| 30 | DELETE | `/api/assignments/:id` | `assignment.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Xóa bài tập |
| 31 | PUT | `/api/assignments/grade/:submissionId` | `assignment.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Chấm điểm bài nộp |
| 32 | GET | `/api/assignments/:id` | `assignment.controller.js` | Direct Model | `verifyUser` | All | Chi tiết bài tập |
| 33 | GET | `/api/assignments/class/:classId` | `assignment.controller.js` | Direct Model | `verifyUser` | All | Bài tập theo lớp |
| 34 | GET | `/api/assignments/submissions/:assignmentId` | `assignment.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Xem danh sách bài nộp |
| 35 | POST | `/api/assignments/submit/:assignmentId` | `assignment.controller.js` | Direct Model | `verifyUser, upload` | Student | Nộp / Nộp lại bài tập |
| 36 | DELETE | `/api/assignments/submit/:assignmentId` | `assignment.controller.js` | Direct Model | `verifyUser` | Student | Hủy nộp bài tập |
| 37 | POST | `/api/attendances` | `attendance.controller.js` | `attendance.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Điểm danh hàng loạt |
| 38 | PUT | `/api/attendances/:id` | `attendance.controller.js` | `attendance.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Cập nhật điểm danh |
| 39 | GET | `/api/attendances/class/:classId` | `attendance.controller.js` | `attendance.service.js` | `verifyUser` | All | Xem điểm danh lớp |
| 40 | GET | `/api/attendances/student/:studentId` | `attendance.controller.js` | `attendance.service.js` | `verifyUser` | All | Điểm danh sinh viên |
| 41 | GET | `/api/attendances/stats/class/:classId` | `attendance.controller.js` | `attendance.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Thống kê điểm danh |
| 42 | POST | `/api/grades` | `grade.controller.js` | `grade.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Nhập / sửa điểm |
| 43 | GET | `/api/grades/class/:classId` | `grade.controller.js` | `grade.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Xem bảng điểm lớp |
| 44 | GET | `/api/grades/student/:studentId` | `grade.controller.js` | `grade.service.js` | `verifyUser` | All | Xem điểm cá nhân |
| 45 | GET | `/api/grades/gpa/:classId/:studentId` | `grade.controller.js` | `grade.service.js` | `verifyUser` | All | Tính tổng kết GPA |
| 46 | GET | `/api/announcements` | `announcement.controller.js` | `announcement.service.js` | `verifyUser` | All | Danh sách thông báo |
| 47 | PATCH | `/api/notifications/read-all` | Inline Router Handler | None | `verifyUser` | All | Đánh dấu đọc tất cả |
| 48 | PATCH | `/api/notifications/:id/read` | Inline Router Handler | None | `verifyUser` | All | Đánh dấu đọc 1 tin |
| 49 | GET | `/api/announcements/:id` | `announcement.controller.js` | `announcement.service.js` | `verifyUser` | All | Chi tiết thông báo |
| 50 | POST | `/api/announcements` | `announcement.controller.js` | `announcement.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Đăng thông báo mới |
| 51 | PUT | `/api/announcements/:id` | `announcement.controller.js` | `announcement.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Sửa thông báo |
| 52 | DELETE | `/api/announcements/:id` | `announcement.controller.js` | `announcement.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Xóa thông báo |
| 53 | POST | `/api/questions/import-excel` | `question.controller.js` | `question.service.js` | `verifyUser, isTeacher, multer` | Teacher/Admin | Import câu hỏi Excel |
| 54 | GET | `/api/questions` | `question.controller.js` | `question.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Ngân hàng câu hỏi |
| 55 | POST | `/api/questions` | `question.controller.js` | `question.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Tạo câu hỏi mới |
| 56 | PUT | `/api/questions/:id` | `question.controller.js` | `question.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Sửa câu hỏi |
| 57 | DELETE | `/api/questions/:id` | `question.controller.js` | `question.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Xóa câu hỏi |
| 58 | GET | `/api/exams/class/:classId` | `exam.controller.js` | Direct Model | `verifyUser` | All | Lấy danh sách đề thi |
| 59 | GET | `/api/exams` | `exam.controller.js` | Direct Model | `verifyUser` | All | Lấy tất cả đề thi |
| 60 | GET | `/api/exams/:id` | `exam.controller.js` | Direct Model | `verifyUser` | All | Chi tiết đề thi |
| 61 | POST | `/api/exams` | `exam.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Tạo đề thi thủ công |
| 62 | POST | `/api/exams/generate-auto` | `exam.controller.js` | `exam.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Sinh đề thi tự động |
| 63 | PUT | `/api/exams/:id` | `exam.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Cập nhật đề thi |
| 64 | DELETE | `/api/exams/:id` | `exam.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Xóa đề thi |
| 65 | POST | `/api/exam-attempts/start` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser` | Student | Bắt đầu bài thi |
| 66 | POST | `/api/exam-attempts/:id/submit` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser` | Student | Nộp bài thi |
| 67 | GET | `/api/exam-attempts/:id` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser` | Student/Teacher | Chi tiết bài nộp thi |
| 68 | POST | `/api/exam-attempts/:id/warning` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser` | Student | Ghi nhận cảnh báo cheat |
| 69 | PUT | `/api/exam-attempts/:id/grade-essay` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Chấm điểm tự luận |
| 70 | GET | `/api/exam-attempts/:id/review` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Xem bài thi để chấm |
| 71 | GET | `/api/exam-attempts/exam/:examId` | `examAttempt.controller.js` | `examAttempt.service.js` | `verifyUser, isTeacher` | Teacher/Admin | Danh sách lượt thi |
| 72 | POST | `/api/live/create` | `live.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Mở phòng học live |
| 73 | GET | `/api/live/active/:classId` | `live.controller.js` | Direct Model | `verifyUser` | All | Trạng thái phòng live |
| 74 | POST | `/api/live/end` | `live.controller.js` | Direct Model | `verifyUser, isTeacher` | Teacher/Admin | Đóng phòng học live |
| 75 | POST | `/api/live/jaas-token` | `jaas.controller.js` | Direct Signer | `verifyUser` | All | Sinh JWT 8x8 JaaS |

---

## 2. CHI TIẾT CẤU TRÚC REQUEST / RESPONSE MẪU

### 2.1 Standard Success Response Format
```json
{
  "message": "Thao tác thành công",
  "data": { ... }
}
```

### 2.2 Standard Error Response Format
```json
{
  "message": "Thông báo lỗi chi tiết",
  "error": "Error stack string (chỉ xuất hiện ở môi trường development)"
}
```

---

## 3. PHÂN TÍCH VALIDATION & ERROR CODES

| Mã Lỗi HTTP | Ý Nghĩa | Trường Hợp Xảy Ra |
| :---: | :--- | :--- |
| `400 Bad Request` | Dữ liệu đầu vào không hợp lệ | Thiếu email/password, upload sai định dạng file Excel, tổng điểm đề thi không đúng 10.0. |
| `401 Unauthorized` | Chưa xác thực | Không có Header Authorization hoặc Token JWT hết hạn / không hợp lệ. |
| `403 Forbidden` | Không có quyền truy cập | Student gọi API của Admin/Teacher (VD: POST /api/courses, POST /api/questions). |
| `404 Not Found` | Không tìm thấy tài nguyên | ID không tồn tại trong Database hoặc API Endpoint không khớp router. |
| `500 Internal Server Error` | Lỗi Server nội bộ | Lỗi kết nối DB, lỗi mã hóa JWT RSA Private Key 8x8 JaaS. |
