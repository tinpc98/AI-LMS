# 🛡️ Phân Tích & Đánh Giá Phân Quyền Hạn Dùng (RBAC Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Mô Hình Phân Quyền (RBAC Framework)](#1-tổng-quan-mô-hình-phân-quyền-rbac-framework)
2. [Đánh Giá Phân Quyền Dọc (Vertical Privilege Control)](#2-đánh-giá-phân-quyền-dọc-vertical-privilege-control)
3. [Đánh Giá Phân Quyền Ngang & IDOR (Horizontal Access & IDOR)](#3-đánh-giá-phân-quyền-ngang--idor-horizontal-access--idor)
4. [Lỗ Hổng Kiểm Tra Quyền Sở Hữu (Owner Check Breakdown)](#4-lỗi-hổng-kiểm-tra-quyền-sở-hữu-owner-check-breakdown)
5. [Nguy Cơ Leo Escalation Quyền Hạn (Privilege Escalation)](#5-nguy-cơ-leo-escalation-quyền-hạn-privilege-escalation)
6. [Bảng Ma Trận Đánh Giá Phân Quyền Chi Tiết Theo Module](#6-bảng-ma-trận-đánh-giá-phân-quyền-chi-tiết-theo-module)
7. [Khuyến Nghị Cải Tiến RBAC Standard Enterprise](#7-khuyến-nghị-cải-tiến-rbac-standard-enterprise)

---

## 1. Tổng Quan Mô Hình Phân Quyền (RBAC Framework)

Hệ thống AI LMS áp dụng mô hình **Role-Based Access Control (RBAC)** với 3 vai trò chính:
1. `Admin`: Quản trị viên hệ thống (Toàn quyền).
2. `Teacher`: Giáo viên (Tạo lớp, tạo đề thi, chấm điểm).
3. `Student`: Học sinh (Tham gia lớp, nộp bài, thi thử).

---

## 2. Đánh Giá Phân Quyền Dọc (Vertical Privilege Control)

Phân quyền dọc đảm bảo người dùng ở vai trò thấp (`Student`) không thể truy cập các route dành cho vai trò cao hơn (`Teacher`, `Admin`).

### 🔴 Lỗ Hổng Phân Quyền Dọc Phát Hiện Trong Codebase:

1. **API Quản lý Lớp Học (`class.controller.js`):**
   - Route `POST /api/classes` (Tạo lớp học) sử dụng middleware `isTeacher`.
   - Tuy nhiên, trong `class.controller.js:updateClass` và `deleteClass`, việc kiểm tra quyền chỉ kiểm tra `req.user.role === 'Admin' || class.teacherId == req.user.id`.
   - **Vấn đề:** Nhiều API liên quan đến khóa học và bài học lại thiếu `isTeacher` ở Router layer, chỉ có `verifyUser`. Học sinh nắm token hợp lệ có thể tự gửi HTTP Request gọi API tạo bài học hoặc cập nhật thông tin bài giảng nếu biết được ID!

---

## 3. Đánh Giá Phân Quyền Ngang & IDOR (Horizontal Access & IDOR)

Phân quyền ngang đảm bảo User A (ví dụ: Học sinh A) không thể xem, sửa hoặc xóa dữ liệu của User B (Học sinh B).

### 🔴 LỖ HỔNG IDOR CỰC KỲ NGHIỆM TRỌNG TRONG QUẢN LÝ BÀI NỘP (`submission`):

1. **Xem chi tiết bài nộp bài tập ([assignment.controller.js](file:///e:/AI-LMS/Backend/src/controllers/assignment.controller.js)):**
   - Endpoint `GET /api/assignments/submissions/:submissionId` hoặc `GET /api/assignments/:id/my-submission`.
   - Khi học sinh lấy bài nộp của mình hoặc xem điểm bài nộp, Controller **không đối chiếu** `submission.studentId === req.user.id`.
   - **Hậu quả:** Học sinh A chỉ cần đổi `submissionId` trên đường dẫn URL là có thể xem toàn bộ bài làm, đáp án và file đính kèm của Học sinh B trong cùng lớp học!

2. **IDOR trong Chi Tiết Bài Thi (`examAttempt.controller.js`):**
   - Endpoint `GET /api/exam-attempts/:id` lấy chi tiết kết quả lượt thi.
   - Controller thiếu bước kiểm tra: `if (attempt.studentId.toString() !== req.user.id && req.user.role !== 'Teacher' && req.user.role !== 'Admin') return res.status(403)...`
   - Bất kỳ học sinh nào cũng xem được kết quả thi, bảng trả lời chi tiết của các bạn khác.

---

## 4. Lỗ Hổng Kiểm Tra Quyền Sở Hữu (Owner Check Breakdown)

- Module `ExamSet` xử lý tốt quyền sở hữu thông qua `examSetAccess.middlewares.js` (Phân biệt Owner, Shared User, Admin).
- Nhưng các module `Folder`, `Live Session`, `Announcement` lại **bỏ quên hoàn toàn bước kiểm tra Owner Check**. Giáo viên A có thể vô hiệu hóa hoặc xóa Live Session mà Giáo viên B đã khởi tạo!

---

## 5. Nguy Cơ Leo Escalation Quyền Hạn (Privilege Escalation)

1. **Self-Role Escalation khi Update Profile (`auth.controllers.js:updateMyProfile`):**
   ```javascript
   const { fullName, phone, avatar, teachingSubjects, availabilitySchedule } = req.body;
   ```
   - ⭐ **Tốt:** Controller này đã chủ động loại trừ thuộc tính `role` khỏi `updateData`, ngăn chặn việc Học sinh tự nâng quyền thành Admin qua API `PUT /api/auth/me`.
   - ❌ **Tuy nhiên:** Trong `updateUser` (Admin API `PUT /api/users/:id`), nếu Admin ủy quyền cho Giáo viên quản lý user, thiếu kiểm tra ngăn cản việc một Admin thường hạ cấp hoặc xóa Root Admin.

---

## 6. Bảng Ma Trận Đánh Giá Phân Quyền Chi Tiết Theo Module

| Module / Endpoint | Trách nhiệm Vai trò | Check Owner? | Nguy cơ IDOR | Đánh giá |
| :--- | :---: | :---: | :---: | :---: |
| `POST /api/classes` | Teacher / Admin | N/A | Không | ⭐ Tốt |
| `DELETE /api/classes/:id` | Teacher Owner / Admin | ✔ Có | Không | ⭐ Tốt |
| `GET /api/exam-attempts/:id` | Student Owner / Teacher | ❌ Thiếu | 🔴 RẤT CAO | ❌ Sai thiết kế |
| `PUT /api/assignments/:id` | Teacher Owner | ❌ Thiếu | 🟠 CAO | ⚠ Cần cải thiện |
| `GET /api/folders/:id` | Owner / Shared | ❌ Thiếu | 🟠 CAO | ❌ Sai thiết kế |

---

## 7. Khuyến Nghị Cải Tiến RBAC Standard Enterprise

1. Tạo helper middleware toàn cục `checkOwnerOrRole(Model, ownerField, allowedRoles)` để áp dụng đồng bộ cho tất cả các endpoint lấy chi tiết / sửa / xóa tài nguyên.
2. Sửa ngay lỗ hổng IDOR tại `examAttempt.controller.js` và `assignment.controller.js`.
