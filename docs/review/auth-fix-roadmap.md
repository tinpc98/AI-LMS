# 🗺️ Lộ Trình Sửa Lỗi & Tối Ưu Phân Hệ Auth (Auth Fix Roadmap)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Kế Hoạch Tối Ưu Phân Hệ Auth](#1-tổng-quan-kế-hoạch-tối-ưu-phân-hệ-auth)
2. [Sprint AUTH-1 — Critical Login, Token & Session Repair](#2-sprint-auth-1--critical-login-token--session-repair)
3. [Sprint AUTH-2 — RBAC & Owner Check Enforcement](#3-sprint-auth-2--rbac--owner-check-enforcement)
4. [Sprint AUTH-3 — Contract Standardization & Error Handling](#4-sprint-auth-3--contract-standardization--error-handling)
5. [Sprint AUTH-4 — Security Hardening & Observability](#5-sprint-auth-4--security-hardening--observability)

---

## 1. Tổng Quan Kế Hoạch Tối Ưu Phân Hệ Auth

Lộ trình nâng cấp và gia cố phân hệ Authentication & Authorization được phân bổ thành **4 Sprints chiến lược** nhằm đưa hệ thống đạt chuẩn an toàn bảo mật Enterprise Production-Ready.

---

## 2. Sprint AUTH-1 — Critical Login, Token & Session Repair

**Mục tiêu:** Xử lý triệt để các sự cố vỡ luồng đăng nhập, token undefined và nạp lại trang không mong muốn.

- [x] **Task 1.1:** Sửa bóc tách payload trong `LoginPage.tsx` (Bóc tách đúng `res.data.accessToken` và `res.data.data`).
- [x] **Task 1.2:** Chuẩn hóa lưu trữ LocalStorage (`accessToken`, `userRole` dạng lowercase, `user` JSON).
- [x] **Task 1.3:** Cập nhật `verifyUser` middleware query DB kiểm tra `isDeleted` và `status` ở từng request.
- [x] **Task 1.4:** Sửa đè Route `/api/notifications` trong `main.js` (Bỏ dòng đăng ký đè `AnnouncementRouter`).
- [x] **Task 1.5:** Thay thế `window.location.href` trong `axiosClient.ts` bằng sự kiện custom `unauthorized-logout` (0 Reload).

---

## 3. Sprint AUTH-2 — RBAC & Owner Check Enforcement

**Mục tiêu:** Vá 100% các lỗ hổng IDOR và nâng cao khả năng phân quyền theo quyền sở hữu tài nguyên.

- [ ] **Task 2.1:** Bổ sung Owner Check cho API `getSubmissionById` trong `assignment.controller.js` (Chỉ cho phép Student chính chủ xem bài nộp).
- [ ] **Task 2.2:** Bổ sung Owner Check cho API `getExamAttemptById` trong `examAttempt.controller.js`.
- [ ] **Task 2.3:** Kiểm tra quyền phân công giáo viên vào lớp học trong `class.controller.js`.
- [ ] **Task 2.4:** Thêm validation kiểm tra học sinh đã enrolled vào lớp mới được phép nộp bài tập.

---

## 4. Sprint AUTH-3 — Contract Standardization & Error Handling

**Mục tiêu:** Thống nhất 100% định dạng phàn hồi giữa Backend và Frontend.

- [ ] **Task 3.1:** Chuẩn hóa Response Error Payload toàn hệ thống qua `sendError` helper.
- [ ] **Task 3.2:** Thống nhất metadata phân trang trả về dạng `{ page, limit, total, totalPages }`.
- [ ] **Task 3.3:** Sửa route bài học Backend `/api/lesson` ➔ `/api/lessons` cho khớp với Frontend.
- [ ] **Task 3.4:** Loại bỏ các thông báo lỗi quá chi tiết rò rỉ cấu trúc DB tại Backend.

---

## 5. Sprint AUTH-4 — Security Hardening & Observability

**Mục tiêu:** Gia cố an ninh bảo mật theo chuẩn OWASP Top 10 và tích hợp Refresh Token.

- [ ] **Task 4.1:** Loại bỏ hoàn toàn fallback JWT secret key `"123456"`. Ném exception dừng server nếu thiếu `JWT_SECRET`.
- [ ] **Task 4.2:** Tích hợp `express-rate-limit` chống Brute Force cho `/api/auth/login`.
- [ ] **Task 4.3:** Tích hợp `helmet()` bảo vệ HTTP Security Headers.
- [ ] **Task 4.4:** Triển khai kiến trúc Dual-Token (Short-lived Access Token 15m + Long-lived Refresh Token 7d).
- [ ] **Task 4.5:** Viết bộ kiểm thử tự động (Automated Integration Tests) cho toàn bộ luồng Auth.
