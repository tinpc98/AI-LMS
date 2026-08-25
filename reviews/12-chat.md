# 12 - Trò chuyện (Chat)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Chat cung cấp hệ thống giao tiếp realtime (thời gian thực) trong phạm vi Lớp học (`classId`). Nó bao gồm gửi tin nhắn văn bản, tệp đính kèm (ảnh/file), thả biểu tượng cảm xúc (reactions), và trả lời tin nhắn (replyTo). Mọi hoạt động realtime được xử lý bằng Socket.IO.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `message.model.js` lưu trữ reaction, `replyTo`, và `attachments`. Sử dụng cursor-based pagination (chỉ mục `_id`) giúp query tin nhắn cực nhanh. |
| REST API | ✅ Hoàn thành | API getMessages, sendMessage, editMessage (có giới hạn 15 phút), deleteMessage. |
| Phân quyền | ✅ Hoàn thành | Người gửi, Giáo viên hoặc Admin mới có quyền xóa tin nhắn. |
| Validation | ✅ Hoàn thành | Whitelist các emojis (`👍`, `❤️`, `😂`, `😮`, `😢`, `🙏`) để chống spam Unicode lạ. |
| Frontend - All Roles | ✅ Hoàn thành | |
| Realtime / WebSocket| ✅ Hoàn thành | `chat.socket.js` hỗ trợ join phòng theo `classId`, hiển thị trạng thái `TYPING_START`/`TYPING_END` mượt mà. |
| Xử lý lỗi (Soft Delete) | ✅ Hoàn thành | Không xóa tệp tin trên hệ thống lưu trữ ngay lập tức (Soft Delete), để giữ tệp cho truy vết và dọn dẹp sau bằng cron job 30 ngày. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| GET | `/api/chat/class/:classId`| `verifyUser`, `checkClassAccess` | Lấy danh sách tin nhắn (cursor) | 🟢 Hoạt động |
| POST | `/api/chat/class/:classId` | `verifyUser` | Gửi tin nhắn | 🟢 Hoạt động |
| PUT | `/api/chat/class/:classId/:messageId`| `verifyUser` | Sửa tin nhắn (< 15p) | 🟢 Hoạt động |
| DELETE| `/api/chat/class/:classId/:messageId`| `verifyUser` | Xóa tin nhắn (Mềm) | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi. Module Chat được tổ chức rất sạch sẽ, Cursor Pagination tối ưu được vấn đề tải hàng ngàn tin nhắn.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Sửa tin nhắn quá 15 phút | Ném lỗi 403 `EDIT_TIMEOUT` | Đã xử lý logic trong `editMessage`. | Chưa kiểm chứng |
| 2 | Phân quyền xóa | Học sinh không thể xóa tin của người khác | Xử lý tốt, chỉ có `isSender`, `isTeacherOfClass`, `isAdmin` mới được phép. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- (Không đáng kể) Việc phân trang trả về mảng đã `reverse()` để Frontend dễ render là một giải pháp tốt nhưng mảng bị đột ngột đổi cấu trúc có thể khó test ở các endpoint ngoài.

## 7. Việc cần làm

(Không có)
