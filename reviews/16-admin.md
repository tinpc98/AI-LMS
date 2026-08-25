# 16 - Quản trị hệ thống (Admin)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Admin là trung tâm điều khiển hệ thống, quản lý tài khoản người dùng, lớp học, khóa học và cài đặt hệ thống. Trọng tâm của module 16 (trong file này) là tính năng Quản lý Tài khoản (Account Management). Các tính năng như thùng rác, xóa vĩnh viễn, khôi phục đều đã hoàn thiện, FE sử dụng custom hook dùng chung `useAdminListQuery` rất tốt.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Tái sử dụng `user.model.js` của module Auth. |
| REST API | ✅ Hoàn thành | Đủ API lấy danh sách, CRUD, thùng rác. |
| Phân quyền | ✅ Hoàn thành | Bọc `isAdmin` trên mọi endpoint. |
| Validation | ✅ Hoàn thành | Bắt buộc `fullName`, `email`, `password`. |
| Frontend - Admin | ✅ Hoàn thành | UI Quản lý tài khoản hỗ trợ phân trang, bộ lọc (search, role, status), thùng rác. Xử lý logic rất sạch. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Báo lỗi toast rõ ràng, handle fail an toàn. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

*(Tham khảo lại danh sách API Admin tại module 01-auth-users)*

## 4. Lỗi phát hiện

Không có lỗi nghiêm trọng. Việc bóc response (R1) hay lỗi vòng lặp đều đã được tối ưu từ trước.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | FE phân trang và search | Query parameters gửi đúng | FE gửi đúng params thông qua `accountService` | Chưa kiểm chứng |
| 2 | Chức năng Thùng rác (Soft Delete) | Chia tab riêng | Có tab Trash, gọi đúng `/api/users/trash` | Chưa kiểm chứng |
| 3 | Khôi phục & Xóa vĩnh viễn | Gọi đúng endpoint | API `/restore` và `/force` được gọi | Chưa kiểm chứng |

*Lưu ý: Phân tích mã tĩnh.*

## 6. Nợ kỹ thuật

- **Hard-code Reset Password:** Việc reset password trên FE đang gửi thẳng mật khẩu cố định `defaultPassword123!` qua API `updateUser`. Về mặt kĩ thuật chạy được (Backend có hash tự động), nhưng nên tách riêng thành endpoint `/reset-password` và sinh mật khẩu ngẫu nhiên hoặc gửi link qua email.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Viết endpoint Reset Password sinh mật khẩu ngẫu nhiên và email cho user | 🟡 Trung bình | 4h | Cả hai |
