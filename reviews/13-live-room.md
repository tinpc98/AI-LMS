# 13 - Phòng học Live (Live Session)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Phòng học Live chịu trách nhiệm tích hợp Jitsi as a Service (JaaS) và Socket.IO để phục vụ giảng dạy trực tuyến. Kiến trúc tách biệt rõ ràng việc lấy Token qua HTTP (bảo mật JWT của JaaS) và tracking chuyên cần qua WebSockets. Quản lý trạng thái Frontend sử dụng custom hooks rất tốt.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Quản lý phiên (`liveSession.model.js`), track `joinTime`, `leaveTime`, tính tổng duration. Partial Index ngăn tạo nhiều Live cùng lúc. |
| REST API | ✅ Hoàn thành | API cấp token (`liveApi.getLiveSessionToken`). Tách biệt HTTP (metadata) và Socket (chuyên cần). |
| Phân quyền | ✅ Hoàn thành | Socket từ chối các kết nối trái phép nếu học sinh chưa ghi danh hoặc user không thuộc lớp. |
| Validation | ✅ Hoàn thành | Backend bắt lỗi mã cụ thể (`LIVE_STUDENT_NOT_ENROLLED`, ...). |
| Frontend - All Roles | ✅ Hoàn thành | UI sử dụng `@jitsi/react-sdk`. Xử lý lỗi Insecure Context (Camera/Mic) rất tinh tế, không bị đè state. |
| Realtime (nếu có) | ✅ Hoàn thành | Emit realtime event `LIVE_PARTICIPANTS_UPDATED` thông qua `room_class_{classId}`. |
| Xử lý lỗi | ✅ Hoàn thành | Frontend toast lỗi dựa trên mã code backend, double request guard (in-flight ref) chống spam API. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API & Socket Event

| Giao thức | Path/Event | Vai trò | Trạng thái |
|---|---|---|---|
| REST | `/api/live-sessions/...` | Quản lý vòng đời (Tạo/Sửa/Xóa buổi học) | 🟢 Hoạt động |
| REST | `/api/live-sessions/token` | Cấp JWT JaaS Token an toàn | 🟢 Hoạt động |
| SOCKET | `JOIN_CLASS_ROOM` | Join room, record `joinTime` | 🟢 Hoạt động |
| SOCKET | `LEAVE_CLASS_ROOM` | Leave room, record `leaveTime` & `durationSeconds` | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi. Các vấn đề vòng lặp render, nuốt lỗi camera đã được team Frontend xử lý sạch ở `LiveSessionPage.tsx` và `useJaasConference.ts`.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Mất kết nối đột ngột | Tính đúng thời gian học | Sự kiện `disconnect` trên socket cập nhật `leaveTime` an toàn. | Chưa kiểm chứng |
| 2 | Click liên tục nút Join | Không spam API lấy token | Biến `inFlightRef` chặn double request. | Chưa kiểm chứng |
| 3 | Mở web trên HTTP | Cảnh báo Insecure Context | Tách bạch state lỗi HTTPS khỏi lỗi thiết bị Jitsi. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Vì Socket server tích hợp chung với REST API Server nên khả năng scale ngang (Horizontal Scaling) trong tương lai cần triển khai Redis Adapter cho Socket.IO.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Cấu hình Redis Adapter cho Socket.io nếu hệ thống scale nhiều instance | 🔵 Thấp | 8h | BE |
