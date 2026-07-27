# PHÂN TÍCH API VÀ CÁC THÀNH PHẦN KHÔNG ĐƯỢC SỬ DỤNG (UNUSED API ANALYSIS)

Tài liệu này tổng hợp danh sách các API Endpoints, Routes, Controller functions, và Service functions đã được xây dựng sẵn trên Backend nhưng Frontend **chưa tích hợp hoặc đang tự xử lý ở Client**.

---

## 📑 MỤC LỤC
1. [Danh sách Backend APIs Chưa Được Frontend Gọi](#1-danh-sách-backend-apis-chưa-được-frontend-gọi)
2. [Chi tiết Phân tích & Nguyên nhân](#2-chi-tiết-phân-tích--nguyên-nhân)
3. [Đề xuất Hướng Xử lý & Refactor](#3-đề-xuất-hướng-xử-lý--refactor)

---

## 1. DANH SÁCH BACKEND APIS CHƯA ĐƯỢC FRONTEND GỌI

| STT | Endpoint | Method | Backend Controller Function | Service / Direct Model | Tình trạng ở Frontend | Nguyên nhân |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `/api/classes/:id/resources/:resourceId` | DELETE | `RemoveResource` | Direct Model | Có trong `classApi.ts`, chưa gắn vào UI button | UI chưa thiết kế nút "Xóa tài nguyên" |
| 2 | `/api/announcements/:id` | PUT | `updateAnnouncement` | `announcement.service.js` | Có trong `announcementApi.ts`, chưa gắn vào UI | UI Thông báo mới chỉ có Nút Tạo & Xóa |
| 3 | `/api/grades/gpa/:classId/:studentId` | GET | `getStudentGPA` | `grade.service.js` | Có trong `gradeApi.ts`, chưa dùng kết quả | Client tự tính GPA bằng JS trên FE |
| 4 | `/api/users/:id` | GET | `getUserById` | Direct Model | Không có trong FE `authApi.ts` | FE lấy data trực tiếp từ hàng của Table |
| 5 | `/api/courses/:id` | GET | `getCourseById` | `course.service.js` | Không có trong FE `courseApi` | FE lấy data trực tiếp từ hàng của Table |
| 6 | `/api/assignments/:id` | GET | `getAssignmentById` | Direct Model | FE có khai báo nhưng dùng `getAssignmentsByClass` | FE load cả danh sách rồi `.find(id)` |
| 7 | `/api/exams/:id` | GET | `getExamById` | Direct Model | FE load cả danh sách đề rồi `.find(id)` | FE tránh gọi thêm 1 HTTP request lẻ |

---

## 2. CHI TIẾT PHÂN TÍCH & NGUYÊN NHÂN

### 2.1 API `/api/classes/:id/resources/:resourceId` (DELETE)
- **Tình trạng**: Controller `RemoveResource` đã viết sẵn trong `class.controller.js` hỗ trợ pull `resourceId` khỏi mảng `resources` của `Class`.
- **Nguyên nhân**: Trên UI [ClassroomDetail.tsx](file:///e:/AI-LMS/Frontend/src/pages/teachers/ClassroomDetail.tsx), tab Tài nguyên hiển thị danh sách đính kèm nhưng chưa đặt sự kiện `onClick` cho nút Xóa tài nguyên.

### 2.2 API `/api/announcements/:id` (PUT)
- **Tình trạng**: Backend có hàm `updateAnnouncement` nâng cấp tiêu đề & nội dung thông báo.
- **Nguyên nhân**: UI Thông báo tại [ClassDetail.tsx](file:///e:/AI-LMS/Frontend/src/pages/students/ClassDetail.tsx) chỉ cho phép Giáo viên Đăng mới hoặc Xóa bỏ thông báo cũ, chưa thiết kế Drawer Sửa thông báo.

### 2.3 API `/api/grades/gpa/:classId/:studentId` (GET)
- **Tình trạng**: Service `grade.service.js` đã tính sẵn GPA có trọng số (Attendance 10%, Assignment 20%, Midterm 30%, Final 40%).
- **Nguyên nhân**: Frontend Component `GradeOverview.tsx` hiện tại đang tự tính điểm trung bình bằng thuật toán JavaScript riêng tại Client, không gọi API này dẫn đến nguy cơ lệch công thức giữa FE và BE.

---

## 3. ĐỀ XUẤT HƯỚNG XỬ LÝ & REFACTOR

1. **Giữ nguyên các Endpoints này**: KHÔNG xóa bất kỳ Route/Controller/Service nào trên Backend vì tất cả đều tuân thủ chuẩn RESTful API và có giá trị sử dụng khi hoàn thiện giao diện.
2. **Kế hoạch Tích hợp Frontend**:
   - **Tích hợp `removeResource`**: Gán sự kiện cho biểu tượng Thùng rác bên cạnh mỗi file tài nguyên lớp học.
   - **Tích hợp `updateAnnouncement`**: Thêm nút "Chỉnh sửa" vào Menu thao tác thông báo.
   - **Tích hợp `getStudentGPA`**: Chuyển logic tính điểm trung bình sang dùng kết quả trả về từ Backend API để đảm bảo tính nhất quán dữ liệu toán học toàn hệ thống.
