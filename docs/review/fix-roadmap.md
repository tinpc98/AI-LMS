# 🗺️ Lộ Trình Sửa Lỗi Ưu Tiên (Fix Roadmap)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Kế Hoạch Fix Bug (Fix Roadmap Overview)](#1-tổng-quan-kế-hoạch-fix-bug-fix-roadmap-overview)
2. [Sprint 1: Xử Lý Lỗi Critical & An Ninh Bảo Mật (Critical Security & Core Bugs)](#2-sprint-1-xử-lý-lỗi-critical--an-ninh-bảo-mật-critical-security--core-bugs)
3. [Sprint 2: Xử Lý Lỗi High Priority & Tối Ưu Database (High Priority & Database Gaps)](#3-sprint-2-xử-lý-lỗi-high-priority--tối-ưu-database-high-priority--database-gaps)
4. [Sprint 3: Xử Lý Lỗi Medium Priority & Tương Thích Frontend (API & Frontend Sync)](#4-sprint-3-xử-lý-lỗi-medium-priority--tương-thích-frontend-api--frontend-sync)
5. [Sprint 4: Refactoring Clean Code & Infrastructure (Clean Code & Observability)](#5-sprint-4-refactoring-clean-code--infrastructure-clean-code--infrastructure)
6. [Bảng Phân Phối Nhân Lực & Thời Gian Dự Kiến](#6-bảng-phân-phối-nhân-lực--thời-gian-dự-kiến)

---

## 1. Tổng Quan Kế Hoạch Fix Bug (Fix Roadmap Overview)

Lộ trình khắc phục được chia làm **4 Sprints** ngắn hạn (mỗi Sprint từ 1-2 tuần) nhằm đảm bảo hệ thống nhanh chóng loại bỏ các rủi ro bảo mật nghiêm trọng nhất trước khi tiến hành refactor code bề nổi.

---

## 2. Sprint 1: Xử Lý Lỗi Critical & An Ninh Bảo Mật (Critical Security & Core Bugs)

**Mục tiêu:** Vá 100% các lỗ hổng an toàn thông tin cấp độ Critical và sửa các route bị vỡ.

- [ ] **Task 1.1:** Xóa bỏ fallback JWT secret `"123456"`. Ném exception dừng server nếu thiếu `JWT_SECRET`. (`auth.middlewares.js`, `auth.services.js`).
- [ ] **Task 1.2:** Sửa lỗi đè Router `/api/notifications` trong `main.js`. Đổi route Announcement về `/api/announcements`.
- [ ] **Task 1.3:** Khắc phục lỗ hổng IDOR tại `assignment.controller.js` và `examAttempt.controller.js` (Thêm Owner Check cho Student).
- [ ] **Task 1.4:** Sửa logic chấm điểm câu hỏi trắc nghiệm nhiều đáp án trong `examAttempt.service.js` (Thêm `.sort()`).
- [ ] **Task 1.5:** Cập nhật `verifyUser` middleware kiểm tra trạng thái DB (`status === 'Active'` và `isDeleted === false`).

---

## 3. Sprint 2: Xử Lý Lỗi High Priority & Tối Ưu Database (High Priority & Database Gaps)

**Mục tiêu:** Giải quyết các nghẽn cổ chai hiệu năng và rò rỉ dữ liệu xóa mềm.

- [ ] **Task 2.1:** Loại bỏ vòng lặp N+1 Query trong `class.controller.js:getClassProgress`.
- [ ] **Task 2.2:** Bổ sung `$match: { isDeleted: false }` vào tất cả các Aggregation Pipeline trong `report.service.js` và `dashboard.service.js`.
- [ ] **Task 2.3:** Tạo Compound Unique Index `{ classId: 1, studentId: 1, date: 1 }` cho `Attendance` Model.
- [ ] **Task 2.4:** Thêm các Compound Indexes thiếu cho `Submission` và `ExamAttempt`.
- [ ] **Task 2.5:** Tích hợp `helmet()` và `express-rate-limit` vào `main.js`.

---

## 4. Sprint 3: Xử Lý Lỗi Medium Priority & Tương Thích Frontend (API & Frontend Sync)

**Mục tiêu:** Đồng bộ API Contract giữa Frontend và Backend, chuẩn hóa Error Handler.

- [ ] **Task 3.1:** Sửa route bài học Backend `/api/lesson` ➔ `/api/lessons` đồng bộ với Frontend call.
- [ ] **Task 3.2:** Ép 100% Controllers trả về response chuẩn qua helper `sendSuccess` / `sendError`.
- [ ] **Task 3.3:** Thêm `.lean()` vào toàn bộ các truy vấn Read-only trong `class.controller.js` và `course.controller.js`.
- [ ] **Task 3.4:** Chuẩn hóa metadata phân trang trả về dạng `{ page, limit, total, totalPages }`.
- [ ] **Task 3.5:** Bổ sung event listener `process.on("unhandledRejection")` trong `main.js`.

---

## 5. Sprint 4: Refactoring Clean Code & Infrastructure (Clean Code & Observability)

**Mục tiêu:** Nâng cao chất lượng mã nguồn dài hạn và khả năng quan sát hệ thống.

- [ ] **Task 4.1:** Chia nhỏ file God Service `examSet.services.js` (77KB) thành 3 sub-services.
- [ ] **Task 4.2:** Rút toàn bộ Mongoose Direct Queries out khỏi `class.controller.js` đưa về `class.service.js`.
- [ ] **Task 4.3:** Chuẩn hóa Roles và Status qua Enum Constants (`src/constants/`).
- [ ] **Task 4.4:** Dọn dẹp các tệp script rác (`reconstruct.js`, `note.txt`).
- [ ] **Task 4.5:** Cấu hình Logger tập trung qua `Winston`.

---

## 6. Bảng Phân Phối Nhân Lực & Thời Gian Dự Kiến

| Sprint | Thời Gian Dự Kiến | Số Lượng Task | Trọng Tâm Xử Lý | Trạng Thái |
| :---: | :---: | :---: | :--- | :---: |
| **Sprint 1** | 1 Tuần | 5 Tasks | Security & Critical Bugs | 🔴 Ưu tiên 1 |
| **Sprint 2** | 1.5 Tuần | 5 Tasks | Database & Performance | 🟠 Ưu tiên 2 |
| **Sprint 3** | 1 Tuần | 5 Tasks | Frontend Compatibility & API | 🟡 Ưu tiên 3 |
| **Sprint 4** | 2 Tuần | 5 Tasks | Clean Code & Refactoring | 🟢 Ưu tiên 4 |
