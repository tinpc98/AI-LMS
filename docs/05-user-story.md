# Tài liệu Danh sách User Stories & Kịch bản Chấp nhận (Agile User Stories & Acceptance Criteria)

Tài liệu đặc tả các User Stories phục vụ quá trình phát triển hệ thống AI-LMS theo phương pháp luận Agile/Scrum.

---

## 📑 MỤC LỤC
1. [Epic 1: Authentication & Authorization (Xác thực & Phân quyền)](#epic-1-authentication--authorization-xác-thực--phân-quyền)
2. [Epic 2: Class & Course Management (Quản lý Lớp học & Khóa học)](#epic-2-class--course-management-quản-lý-lớp-học--khóa-học)
3. [Epic 3: Student Learning Dashboard (Bảng điều khiển Tiến độ Học tập)](#epic-3-student-learning-dashboard-bảng-điều-khiển-tiến-độ-học-tập)
4. [Epic 4: Assignment & Homework Engine (Bài tập & Nộp bài)](#epic-4-assignment--homework-engine-bài-tập--nộp-bài)
5. [Epic 5: AI Exam Builder & Anti-Cheat Proctoring (Đề thi AI & Giám sát Gian lận)](#epic-5-ai-exam-builder--anti-cheat-proctoring-đề-thi-ai--giám-sát-gian-lận)
6. [Epic 6: Attendance & Gradebook (Điểm danh & Sổ điểm)](#epic-6-attendance--gradebook-điểm-danh--sổ-điểm)

---

## EPIC 1: AUTHENTICATION & AUTHORIZATION (XÁC THỰC & PHÂN QUYỀN)

### Story US-01: Đăng nhập Hệ thống theo Vai trò
- **Epic**: Authentication
- **Feature**: Login Page
- **User Story**: Là một người dùng (Admin / Teacher / Student), tôi muốn đăng nhập vào hệ thống bằng Email và Mật khẩu, để có thể truy cập đúng giao diện dành cho vai trò của mình.
- **Priority**: `High` | **Complexity**: `3 Story Points`
- **Acceptance Criteria**:
  - **Given** người dùng ở trang `/login`
  - **When** nhập đúng email và mật khẩu rồi bấm "Đăng nhập"
  - **Then** hệ thống trả về Access Token, lưu thông tin người dùng vào `localStorage` và chuyển hướng:
    - Role `student` -> `/student`
    - Role `teacher` -> `/teacher`
    - Role `admin` -> `/admin`
  - **Given** tài khoản bị Soft Delete (`isDeleted = true`) hoặc bị `Locked`
  - **When** người dùng bấm đăng nhập
  - **Then** hệ thống chặn đăng nhập, trả về HTTP Status `403` với thông báo `"Tài khoản đã bị vô hiệu hóa."`.

---

## EPIC 2: CLASS & COURSE MANAGEMENT (QUẢN LÝ LỚP HỌC & KHÓA HỌC)

### Story US-02: Tham gia Lớp học bằng Join Code (Dành cho Student)
- **Epic**: Class Management
- **Feature**: Class Enrollment
- **User Story**: Là một Học sinh, tôi muốn nhập Mã tham gia lớp (Join Code) do giáo viên cung cấp, để ghi danh vào Lớp học tương ứng.
- **Priority**: `High` | **Complexity**: `5 Story Points`
- **Acceptance Criteria**:
  - **Given** học sinh ở giao diện "Lớp học của tôi"
  - **When** nhập mã `joinCode` hợp lệ (ví dụ: `MATH12A`)
  - **Then** hệ thống tự động thêm học sinh vào mảng `students` của lớp, cập nhật `currentStudents` và hiển thị thẻ lớp học mới trên màn hình.
  - **Given** lớp học đã đạt `maxStudents` (đầy lớp)
  - **When** học sinh bấm gửi mã
  - **Then** hệ thống báo lỗi `"Lớp học đã đủ số lượng học sinh tối đa."`.

---

## EPIC 3: STUDENT LEARNING DASHBOARD (BẢNG ĐIỀU KHIỂN TIẾN ĐỘ HỌC TẬP)

### Story US-03: Xem Tổng quan Tiến độ và Chỉ số Năng lực Học tập
- **Epic**: Student Learning Dashboard
- **Feature**: Learning Progress Dashboard
- **User Story**: Là một Học sinh, tôi muốn xem điểm năng lực học tập tổng hợp (Learning Score), điểm GPA, tỷ lệ chuyên cần và danh sách bài tập/bài thi cần nộp gấp trên 1 màn hình duy nhất, để có thể lên kế hoạch học tập hiệu quả.
- **Priority**: `High` | **Complexity**: `8 Story Points`
- **Acceptance Criteria**:
  - **Given** học sinh đăng nhập thành công và truy cập trang chủ `/student`
  - **Then** hệ thống gọi API duy nhất `learningDashboardService` (Single Source of Truth), hiển thị:
    - Điểm Learning Score (thang 100) kèm Tag AI Powered
    - Widget "Lớp học hôm nay", "Bài tập cần làm", "Lịch thi sắp tới"
    - Widget "AI Learning Insights" đưa ra nhận xét cảnh báo rủi ro học tập.

---

## EPIC 4: ASSIGNMENT & HOMEWORK ENGINE (BÀI TẬP & NỘP BÀI)

### Story US-04: Nộp Bài tập về nhà kèm File đính kèm
- **Epic**: Homework Engine
- **Feature**: Assignment Submission
- **User Story**: Là một Học sinh, tôi muốn tải tệp bài làm lên và nhập câu trả lời tự luận cho bài tập được giao, để giáo viên chấm điểm.
- **Priority**: `High` | **Complexity**: `5 Story Points`
- **Acceptance Criteria**:
  - **Given** học sinh mở trang chi tiết bài tập
  - **When** chọn tối đa 5 file bài làm và bấm "Xác nhận nộp"
  - **Then** hệ thống tải file lên Cloudinary, lưu bản nộp `Submission` vào MongoDB và cập nhật trạng thái bài tập thành `SUBMITTED`.
  - **Given** hạn nộp bài đã trôi qua (`deadline < Date.now()`)
  - **When** học sinh nộp bài
  - **Then** hệ thống ghi nhận trạng thái bài nộp là `LATE` (Nộp muộn).

---

## EPIC 5: AI EXAM BUILDER & ANTI-CHEAT PROCTORING (ĐỀ THI AI & GIÁM SÁT GIAN LẬN)

### Story US-05: Giám sát Gian lận và Cảnh báo Thi Trực tuyến
- **Epic**: Examination Engine
- **Feature**: Anti-Cheat Proctoring
- **User Story**: Là một Giảng viên, tôi muốn hệ thống tự động theo dõi hành vi chuyển tab hoặc thoát toàn màn hình của học sinh trong lúc thi, để đảm bảo tính minh bạch của kỳ thi.
- **Priority**: `High` | **Complexity**: `8 Story Points`
- **Acceptance Criteria**:
  - **Given** học sinh đang làm bài thi tại màn hình `/exam/:attemptId`
  - **When** học sinh chuyển sang tab khác hoặc bấm `Esc` thoát Fullscreen
  - **Then** hệ thống ghi nhận ngay sự kiện gian lận, tăng `cheatCount` thêm 1, hiển thị cảnh báo vi phạm trên giao diện học sinh và phát tín hiệu Socket.io về màn hình của giảng viên.

---

## EPIC 6: ATTENDANCE & GRADEBOOK (ĐIỂM DANH & SỔ ĐIỂM)

### Story US-06: Điểm danh Học sinh theo Buổi học
- **Epic**: Gradebook & Attendance
- **Feature**: Class Attendance
- **User Story**: Là một Giảng viên, tôi muốn đánh dấu trạng thái có mặt/vắng mặt của từng học sinh trong lớp theo ngày dạy, để quản lý tỷ lệ chuyên cần.
- **Priority**: `Medium` | **Complexity**: `3 Story Points`
- **Acceptance Criteria**:
  - **Given** giảng viên mở danh sách điểm danh lớp học ngày hôm nay
  - **When** đánh dấu trạng thái `Present`, `Absent`, `Late`, `Excused` cho các học sinh và bấm "Lưu điểm danh"
  - **Then** hệ thống lưu các bản ghi `Attendance` vào Database (đảm bảo không trùng lặp nhờ Compound Unique Index).
