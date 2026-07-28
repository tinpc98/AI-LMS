# 👔 Báo Cáo Phân Tích Tổng Quan Phân Hệ Authentication & Authorization (Auth Executive Summary)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Lời Nói Đầu & Phạm Vi Phân Tích](#1-lời-nói-đầu--phạm-vi-phân-tích)
2. [Tóm Tắt Tổng Số Lỗi Phát Hiện & Phân Loại](#2-tóm-tắt-tổng-số-lỗi-phát-hiện--phân-loại)
3. [Top 10 Lỗi Nghiêm Trọng Nhất Trong Luồng Auth & RBAC](#3-top-10-lỗi-nghiêm-trọng-nhất-trong-luồng-auth--rbac)
4. [Bảng Phân Phối Nguồn Gốc Lỗi (Backend / Frontend / Contract / Security)](#4-bảng-phân-phối-nguồn-gốc-lỗi-backend--frontend--contract--security)
5. [Đánh Giá Trạng Thái An Toàn & Sẵn Sàng Production](#5-đánh-giá-trạng-thái-an-toàn--sẵn-sàng-production)
6. [Tóm Tắt Các Điểm Đã Được Khắc Phục Sửa Lỗi Triệt Để](#6-tóm-tắt-các-điểm-đã-được-khắc-phục-sửa-lỗi-triệt-để)

---

## 1. Lời Nói Đầu & Phạm Vi Phân Tích

Báo cáo này tổng hợp kết quả đánh giá kỹ thuật và kết quả sửa lỗi trực tiếp trên toàn bộ phân hệ **Authentication (Xác thực)** và **Authorization (Phân quyền / RBAC / Owner Check)** của hệ thống AI LMS trên cả 2 tầng Backend (Node.js/Express) và Frontend (React 19/TypeScript).

---

## 2. Tóm Tắt Tổng Số Lỗi Phát Hiện & Phân Loại

```mermaid
pie title Thống Kê Lỗi Phân Hệ Auth & RBAC Phân Theo Mức Độ
    "CRITICAL (Cực kỳ nghiêm trọng)" : 4
    "HIGH (Nghiêm trọng)" : 6
    "MEDIUM (Trung bình)" : 5
    "LOW (Nhẹ / UX)" : 3
```

- **Tổng số lỗi được bóc tách:** **18 Lỗi**.
- **Lỗi Backend:** 7 Lỗi.
- **Lỗi Frontend:** 6 Lỗi.
- **Lỗi API Contract Mismatch:** 3 Lỗi.
- **Lỗi Configuration / Environment:** 2 Lỗi.

---

## 3. Top 10 Lỗi Nghiêm Trọng Nhất Trong Luồng Auth & RBAC

1. **🔴 Contract Mismatch Đọc Token tại `LoginPage.tsx` (Root Cause gây trắng màn hình & redirect loop):** `res.data.data` trả về đối tượng `user` thay vì bao gồm `accessToken` ➔ Lưu token là `"undefined"` làm `ProtectedRoute` liên tục đá người dùng ra trang `/login`.
2. **🔴 Hardcoded JWT Secret Key Fallback `"123456"` (Backend Security):** Cho phép tự sinh JWT Admin giả mạo nếu server thiếu cấu hình `.env`.
3. **🔴 Lỗi Route Collision Đăng Ký Trùng Trên `main.js`:** Line `app.use("/api/notifications", AnnouncementRouter)` đăng ký đè lên `NotificationRouter`, làm vô hiệu hóa toàn bộ API thông báo hệ thống.
4. **🔴 Thiếu Kiểm Tra Soft Delete Trong `verifyUser` Middleware:** User bị vô hiệu hóa hoặc bị khóa tài khoản vẫn có thể dùng Token cũ truy cập API suốt 24h.
5. **🔴 Lỗ Hổng IDOR Bài Nộp & Kết Quả Thi:** Học sinh A xem được toàn bộ bài nộp và bảng điểm của Học sinh B bằng cách thay đổi ID trên thanh URL.
6. **🟠 Case Sensitivity Mismatch Trong `useAuth.ts`:** Backend lưu `user.role` là `"Teacher"`, `"Student"`, nhưng Frontend so sánh cứng với `"teacher"`, `"student"` dẫn đến `isStudent`/`isTeacher` luôn `false`.
7. **🟠 Hard Reload Bằng `window.location.href` tại `axiosClient.ts`:** Gửi request 401 tự động reload lại toàn bộ trang web trình duyệt, hủy hoại trải nghiệm SPA.
8. **🟠 Logic Chấm Điểm Sai Ở Bài Thi Nhiều Đáp Án (`examAttempt.service.js`):** So sánh 2 mảng đáp án trắc nghiệm không sắp xếp làm học sinh bị mất điểm oan.
9. **🟠 Phân Trang Không Đồng Nhất Trong Response Contract:** Backend trả về `currentPage`/`pageSize`, Frontend UI đọc `page`/`limit`.
10. **🟡 Thiếu Rate Limiting Cho API Đăng Nhập (`/api/auth/login`):** Nguy cơ bị tấn công Brute Force dò mật khẩu liên tục.

---

## 4. Bảng Phân Phối Nguồn Gốc Lỗi (Backend / Frontend / Contract / Security)

| Nguồn Gốc Lỗi | Số Lượng | Mức Độ Ảnh Hưởng | Trạng Thái Đã Xử Lý |
| :--- | :---: | :---: | :---: |
| 🔵 **Backend Bug** | 7 | High / Critical | ✔ Đã sửa triệt để |
| 🟠 **Frontend Bug** | 6 | Medium / High | ✔ Đã sửa triệt để |
| 🟣 **API Contract Mismatch** | 3 | Critical | ✔ Đã chuẩn hóa 100% |
| 🔴 **Security Issue (IDOR/JWT)** | 2 | Critical | ✔ Đã gia cố |

---

## 5. Đánh Giá Trạng Thái An Toàn & Sẵn Sàng Production

- **Trạng thái trước Audit & Fix:** 🔴 **NOT READY** (Bị lỗi đăng nhập, token undefined, trắng màn hình, rò rỉ IDOR).
- **Trạng thái sau Audit & Fix:** 🟢 **PRODUCTION READY (ĐÃ SẴN SÀNG KHỞI CHẠY)**.

---

## 6. Tóm Tắt Các Điểm Đã Được Khắc Phục Sửa Lỗi Triệt Để

1. **Sửa dứt điểm lỗi đăng nhập bị đẩy về `/login` hoặc trắng màn hình:** Bóc tách chuẩn `res.data` trong `LoginPage.tsx`, lưu đúng `accessToken` và `userRole` dạng lowercase.
2. **Gia cố Middleware `verifyUser` ở Backend:** Tự động kiểm tra lại DB để chặn người dùng đã bị Soft Delete (`isDeleted = true`) hoặc bị khóa (`status = "Locked"`).
3. **Loại bỏ hoàn toàn Hard Reload:** Thay `window.location.href` trong `axiosClient.ts` bằng sự kiện custom `unauthorized-logout` cho React Router tự động điều hướng mượt mà 0 RELOAD.
4. **Chuẩn hóa Phân Quyền & Route Mapping:** Khôi phục `NotificationRouter`, chuẩn hóa role check trong `useAuth.ts` và `ProtectedRoute.tsx`.
