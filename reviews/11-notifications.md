# 11 - Thông báo (Notifications)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟡 Cần cải thiện (Về mặt kiến trúc dữ liệu)

## 1. Tóm tắt

Module Thông báo (Notification) phụ trách quản lý hệ thống inbox cá nhân (chuông báo góc phải trên) của từng người dùng. Module sử dụng WebSocket (`notification.socket.js`) để đẩy dữ liệu realtime ngay khi có sự kiện mới.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ⚠️ Một phần | Đang tồn tại song song các trường Legacy (`senderId`, `content`, `link`) và các trường Mới (`actorId`, `message`, `actionUrl`), tạo sự lộn xộn trong document. Cần dọn dẹp. |
| REST API | ✅ Hoàn thành | Đầy đủ API: `send-bulk`, `markAsRead`, `markAllAsRead`, `getUnreadCount`. |
| Phân quyền | ✅ Hoàn thành | Chỉ admin được `send-bulk`. |
| Validation / Security | ✅ Hoàn thành | Sử dụng idempotency index `{recipientId, type, entityId}` để chống việc gửi thông báo lặp lại từ một sự kiện. |
| Frontend - All Roles | ✅ Hoàn thành | File `notification.logic.ts` chia nhóm thông báo theo "Hôm nay", "Hôm qua", "7 ngày trước" rất thông minh bằng hàm thuần, thuận tiện unit test. |
| Realtime / WebSocket| ✅ Hoàn thành | Đã khắc phục lỗi Socket auth, realtime hiện đang hoạt động bình thường qua room `user:${socket.user.id}`. |
| Xử lý lỗi | ✅ Hoàn thành | |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/notifications/send-bulk`| `verifyUser`, `isAdmin` | Admin broadcast cho nhiều user | 🟢 Hoạt động |
| GET | `/api/notifications/my-notifications`| `verifyUser` | Lấy danh sách Inbox | 🟢 Hoạt động |
| PATCH | `/api/notifications/:id/read` | `verifyUser` | Đánh dấu đã đọc 1 item | 🟢 Hoạt động |
| POST | `/api/notifications/mark-all-read`| `verifyUser` | Đánh dấu đã đọc tất cả | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi gây chết tính năng, nhưng có nợ kỹ thuật (Technical Debt) lớn trong Data Schema.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Idempotency | Gửi 2 sự kiện giống nhau không tạo 2 thông báo | Index MongoDB sẽ ném lỗi trùng lặp và bỏ qua. | Chưa kiểm chứng |
| 2 | Socket Authentication | Client không có token sẽ không connect được | Middleware global chặn từ lúc handshake. | Đã xác nhận trong source code |

## 6. Nợ kỹ thuật

- **Data Schema lộn xộn:** Model `Notification` đang gánh cả trường `senderId` và `actorId`, `content` và `message`, `link` và `actionUrl`. Do ứng dụng phát triển qua nhiều giai đoạn nên đang lưu cả định dạng cũ và định dạng mới. Điều này làm tăng kích thước Document và gây nhầm lẫn khi maintain code. Cần có 1 kịch bản Migration để đưa tất cả về định dạng mới và xóa các trường legacy.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Migrate dữ liệu Notification về chuẩn mới và xóa schema legacy. | 🟡 Trung bình | 2h | BE |
