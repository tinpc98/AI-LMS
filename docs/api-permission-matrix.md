# MA TRẬN PHÂN QUYỀN API (API PERMISSION MATRIX)

Tài liệu này thể hiện chi tiết quyền truy cập của từng Vai trò (Admin, Teacher, Student) đối với tất cả 53 Endpoints Backend.

---

## 📑 MỤC LỤC
1. [Ký hiệu Đánh giá](#1-ký-hiệu-đánh-giá)
2. [Bảng Ma trận Phân quyền API](#2-bảng-ma-trận-phân-quản-api)
3. [Phân tích Rủi ro & Cảnh báo Bảo mật RBAC](#3-phân-tích-rủi-ro--cảnh-báo-bảo-mật-rbac)

---

## 1. KÝ HIỆU ĐÁNH GIÁ
- **✅**: Được phép truy cập chính thức (Đã qua kiểm tra Middleware `verifyUser` + `isAdmin` / `isTeacher`).
- **❌**: Không được phép truy cập (Bị chặn ở tầng Middleware authorization).
- **⚠**: **Chưa phân quyền chặt chẽ** (Chỉ có `verifyUser`, thiếu kiểm tra thuộc sở hữu `ownerCheck` hoặc thiếu middleware phân vai trò `isStudent`).

---

## 2. BẢNG MA TRẬN PHÂN QUYỀN API

| STT | Endpoint URL | Method | Admin | Teacher | Student | Middleware Hiện tại | Đánh giá & Ghi chú |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **I** | **AUTH & USER MODULE** | | | | | | |
| 1 | `/api/auth/login` | POST | ✅ | ✅ | ✅ | `loginValidation` | Công khai cho tất cả vai trò |
| 2 | `/api/auth/me` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem profile cá nhân |
| 3 | `/api/auth/me` | PUT | ✅ | ✅ | ✅ | `verifyUser` | Cập nhật profile cá nhân |
| 4 | `/api/users` | GET | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Quản lý danh sách người dùng |
| 5 | `/api/users` | POST | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Tạo người dùng mới |
| 6 | `/api/users/:id` | GET | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Xem thông tin chi tiết user |
| 7 | `/api/users/:id` | PUT | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Cập nhật user |
| 8 | `/api/users/:id` | DELETE | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Xóa mềm user |
| **II** | **CLASS MANAGEMENT MODULE** | | | | | | |
| 9 | `/api/classes` | GET | ✅ | ✅ | ✅ | `verifyUser` | Lấy lớp theo vai trò |
| 10 | `/api/classes/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem chi tiết lớp |
| 11 | `/api/classes/:id/resources` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Thêm tài nguyên lớp |
| 12 | `/api/classes/:id/resources/:resId` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa tài nguyên lớp |
| 13 | `/api/classes` | POST | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Tạo lớp học mới |
| 14 | `/api/classes/:id` | PUT | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Cập nhật lớp học |
| 15 | `/api/classes/:id/assign-teacher` | PUT | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Phân công giáo viên |
| 16 | `/api/classes/:id/students` | POST | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Gán học sinh vào lớp |
| 17 | `/api/classes/:id/students/:stdId` | DELETE | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Xóa học sinh khỏi lớp |
| 18 | `/api/classes/:id` | DELETE | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Xóa mềm lớp học |
| **III** | **COURSE MODULE** | | | | | | |
| 19 | `/api/courses` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem danh sách khóa học |
| 20 | `/api/courses/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem chi tiết khóa học |
| 21 | `/api/courses` | POST | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Tạo khóa học mới |
| 22 | `/api/courses/:id` | PUT | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Cập nhật khóa học |
| 23 | `/api/courses/:id` | DELETE | ✅ | ❌ | ❌ | `verifyUser, isAdmin` | Xóa khóa học |
| **IV** | **LESSON MODULE** | | | | | | |
| 24 | `/api/lesson` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Đăng bài giảng + file |
| 25 | `/api/lesson/class/:classId` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem bài giảng lớp |
| 26 | `/api/lesson/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sửa bài giảng |
| 27 | `/api/lesson/:id` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa bài giảng |
| **V** | **ASSIGNMENT & SUBMISSION MODULE** | | | | | | |
| 28 | `/api/assignments` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Tạo bài tập |
| 29 | `/api/assignments/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sửa bài tập |
| 30 | `/api/assignments/:id` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa bài tập |
| 31 | `/api/assignments/grade/:subId` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Chấm điểm bài nộp |
| 32 | `/api/assignments/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Chi tiết bài tập |
| 33 | `/api/assignments/class/:classId` | GET | ✅ | ✅ | ✅ | `verifyUser` | Danh sách bài tập lớp |
| 34 | `/api/assignments/submissions/:id` | GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xem bài nộp của học sinh |
| 35 | `/api/assignments/submit/:id` | POST | ⚠ | ⚠ | ✅ | `verifyUser` | ⚠ Thiếu cấm Admin/Teacher nộp |
| 36 | `/api/assignments/submit/:id` | DELETE | ⚠ | ⚠ | ✅ | `verifyUser` | ⚠ Thiếu cấm Admin/Teacher hủy |
| **VI** | **ATTENDANCE MODULE** | | | | | | |
| 37 | `/api/attendances` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Điểm danh học sinh |
| 38 | `/api/attendances/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Cập nhật điểm danh |
| 39 | `/api/attendances/class/:classId` | GET | ✅ | ✅ | ⚠ | `verifyUser` | ⚠ Học sinh xem được cả lớp |
| 40 | `/api/attendances/student/:stdId` | GET | ✅ | ✅ | ⚠ | `verifyUser` | ⚠ Chưa chặn xem điểm danh bạn |
| 41 | `/api/attendances/stats/class/:cId`| GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Thống kê điểm danh |
| **VII**| **GRADE MODULE** | | | | | | |
| 42 | `/api/grades` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Nhập/Cập nhật điểm số |
| 43 | `/api/grades/class/:classId` | GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xem bảng điểm lớp |
| 44 | `/api/grades/student/:stdId` | GET | ✅ | ✅ | ⚠ | `verifyUser` | ⚠ Chưa chặn xem điểm bạn |
| 45 | `/api/grades/gpa/:cId/:sId` | GET | ✅ | ✅ | ⚠ | `verifyUser` | ⚠ Chưa chặn xem GPA bạn |
| **VIII**| **ANNOUNCEMENT & NOTIFICATION MODULE** | | | | | | |
| 46 | `/api/announcements` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem thông báo lớp/hệ thống |
| 47 | `/api/notifications/read-all` | PATCH | ✅ | ✅ | ✅ | `verifyUser` | Đánh dấu đọc tất cả |
| 48 | `/api/notifications/:id/read` | PATCH | ✅ | ✅ | ✅ | `verifyUser` | Đánh dấu đọc 1 tin |
| 49 | `/api/announcements/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem chi tiết thông báo |
| 50 | `/api/announcements` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Đăng thông báo mới |
| 51 | `/api/announcements/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sửa thông báo |
| 52 | `/api/announcements/:id` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa thông báo |
| **IX** | **QUESTION BANK MODULE** | | | | | | |
| 53 | `/api/questions/import-excel` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Import câu hỏi Excel |
| 54 | `/api/questions` | GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Quản lý ngân hàng câu hỏi |
| 55 | `/api/questions` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Tạo câu hỏi mới |
| 56 | `/api/questions/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sửa câu hỏi |
| 57 | `/api/questions/:id` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa câu hỏi |
| **X**  | **EXAM MODULE** | | | | | | |
| 58 | `/api/exams/class/:classId` | GET | ✅ | ✅ | ✅ | `verifyUser` | Danh sách đề thi lớp |
| 59 | `/api/exams` | GET | ✅ | ✅ | ✅ | `verifyUser` | Xem tất cả đề thi |
| 60 | `/api/exams/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Chi tiết đề thi |
| 61 | `/api/exams` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Tạo đề thi thủ công |
| 62 | `/api/exams/generate-auto` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sinh đề thi tự động AI |
| 63 | `/api/exams/:id` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Sửa đề thi |
| 64 | `/api/exams/:id` | DELETE | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Xóa đề thi |
| **XI** | **EXAM ATTEMPT & PROCTORING MODULE** | | | | | | |
| 65 | `/api/exam-attempts/start` | POST | ⚠ | ⚠ | ✅ | `verifyUser` | Bắt đầu lượt thi |
| 66 | `/api/exam-attempts/:id/submit` | POST | ⚠ | ⚠ | ✅ | `verifyUser` | Nộp bài thi |
| 67 | `/api/exam-attempts/:id` | GET | ✅ | ✅ | ✅ | `verifyUser` | Chi tiết bài nộp thi |
| 68 | `/api/exam-attempts/:id/warning` | POST | ⚠ | ⚠ | ✅ | `verifyUser` | Ghi nhận gian lận |
| 69 | `/api/exam-attempts/:id/grade-essay` | PUT | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Chấm điểm tự luận |
| 70 | `/api/exam-attempts/:id/review` | GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Review bài làm sinh viên |
| 71 | `/api/exam-attempts/exam/:examId` | GET | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Danh sách bài làm theo đề |
| **XII**| **LIVE SESSION MODULE** | | | | | | |
| 72 | `/api/live/create` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Tạo phòng live |
| 73 | `/api/live/active/:classId` | GET | ✅ | ✅ | ✅ | `verifyUser` | Lấy phòng live active |
| 74 | `/api/live/end` | POST | ✅ | ✅ | ❌ | `verifyUser, isTeacher` | Đóng phòng live |
| 75 | `/api/live/jaas-token` | POST | ✅ | ✅ | ✅ | `verifyUser` | Lấy Token 8x8 JaaS |

---

## 3. PHÂN TÍCH RỦI RO & CẢNH BÁO BẢO MẬT RBAC (SECURITY WARNINGS)

1. **Rủi ro rò rỉ dữ liệu cá nhân (`IDOR - Insecure Direct Object Reference`)**:
   - `GET /api/grades/student/:studentId` và `GET /api/attendances/student/:studentId` chỉ dùng `verifyUser`. Sinh viên A có thể thay `:studentId` của Sinh viên B để xem toàn bộ bảng điểm và lịch sử điểm danh của bạn học.
   - **Khắc phục**: Thêm kiểm tra `if (req.user.role === 'student' && req.user._id !== req.params.studentId) return res.status(403).json(...)`.

2. **Thiếu Middleware `isStudent`**:
   - Các tuyến đường `/api/assignments/submit/:id` và `/api/exam-attempts/start` chỉ yêu cầu `verifyUser`. Admin hoặc Teacher nếu có Token vẫn có thể gửi request làm bài thi / nộp bài tập gây rác Database.
