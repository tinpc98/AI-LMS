# 10 - Điểm danh (Attendance)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Điểm danh quản lý sự hiện diện của học sinh trong các buổi học. Hệ thống tự động tạo các buổi học ảo (virtual sessions) dựa trên lịch học (schedule) của lớp. Hỗ trợ điểm danh hàng loạt (bulk upsert), có khóa thời gian (time-lock) chống điểm danh ngoài giờ, giao diện cho học sinh và giáo viên đầy đủ.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Đầy đủ `classId`, `studentId`, `date`, có unique index tránh trùng lặp. |
| REST API | ✅ Hoàn thành | Hỗ trợ lấy matrix, lấy theo học sinh/lớp, cập nhật hàng loạt. |
| Phân quyền | ✅ Hoàn thành | Giáo viên sở hữu lớp mới được điểm danh, học sinh chỉ xem của mình. |
| Validation | ✅ Hoàn thành | Kiểm tra tính hợp lệ của thời gian (chưa tới giờ hoặc quá giờ không được điểm danh). |
| Frontend - Student | ✅ Hoàn thành | Giao diện Timeline/Table trực quan, biểu đồ tròn chuyên cần, báo lỗi nếu rớt mạng. |
| Frontend - Teacher | ✅ Hoàn thành | Có popup đếm ngược thời gian (`AttendancePopup.tsx`), quản lý local state tốt để không mất dữ liệu đang sửa. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Xử lý lỗi 11000 (duplicate) tốt, FE tách riêng lỗi và không hiển thị chuyên cần 100% ảo. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/attendances/` | `verifyUser`, `isTeacher` | Điểm danh hàng loạt | 🟢 Hoạt động |
| PUT | `/api/attendances/:id` | `verifyUser`, `isTeacher` | Cập nhật 1 bản ghi | 🟢 Hoạt động |
| GET | `/api/attendances/class/:classId/sessions` | `verifyUser` | Lấy lịch các buổi ảo | 🟢 Hoạt động |
| GET | `/api/attendances/class/:classId/matrix` | `verifyUser` | Ma trận điểm danh GV | 🟢 Hoạt động |
| GET | `/api/attendances/class/:classId` | `verifyUser` | Danh sách theo ngày | 🟢 Hoạt động |
| GET | `/api/attendances/student/:studentId` | `verifyUser` | Lịch sử cá nhân | 🟢 Hoạt động |
| GET | `/api/attendances/stats/class/:classId` | `verifyUser`, `isTeacher`| Thống kê tổng quan lớp | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Hiện tại chưa phát hiện lỗi nghiêm trọng nào. Module này xử lý rất tốt các vấn đề trước đây (như lưu state cục bộ, lỗi bóc response sai, và Time-Locking).

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | FE xử lý response trả về | Không bị R1 (Bóc sai tầng) | Gọi đúng `res.data.data` | Chưa kiểm chứng |
| 2 | Time-lock server side | Từ chối nếu ngoài giờ | Check `< sessionStart` hoặc `> sessionEnd` trả 403 | Chưa kiểm chứng |
| 3 | Sửa đổi chưa lưu của GV | FE không bị ghi đè khi API poll | Dùng state riêng (`edits`) phủ lên cache. | Chưa kiểm chứng |
| 4 | Bulk Write | Tối ưu DB | Dùng `Attendance.bulkWrite` | Chưa kiểm chứng |

*Lưu ý: Các test trên thực hiện phân tích mã tĩnh (static analysis), chưa chạy thật (runtime).*

## 6. Nợ kỹ thuật

- `getAttendanceMatrix` hiện đang `find({ classId })` lấy toàn bộ bản ghi của toàn bộ thời gian. Đối với khóa học dài hạn có thể trả về payload JSON khá lớn. Cần cân nhắc phân trang hoặc query theo tháng ở Backend.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Thêm tùy chọn xem Ma trận theo tháng/khoảng thời gian | 🔵 Thấp | 2h | Cả hai |
