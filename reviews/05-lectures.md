# 05 - Bài giảng (Lectures / Lessons)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟡 Cần cải thiện

## 1. Tóm tắt

Module Bài giảng cho phép giáo viên quản lý nội dung video (qua YouTube IFrame API) và đính kèm tài liệu (Cloudinary). Đồng thời module cung cấp cơ chế tracking tiến độ học tập (`LessonProgress`) kết hợp với sinh dữ liệu Tóm tắt AI.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Tách biệt `lesson.model.js` (nội dung) và `lessonProgress.model.js` (tiến độ học sinh). |
| REST API | ✅ Hoàn thành | Đầy đủ CRUD bài giảng, tracking hoàn thành. |
| Phân quyền | ✅ Hoàn thành | Dùng `checkClassTeacherOwnership` chặn giáo viên không thuộc lớp thao tác sửa/xóa bài giảng. Học sinh chỉ thấy bài `isPublished = true`. |
| Validation | ✅ Hoàn thành | |
| Frontend - All Roles | ✅ Hoàn thành | Tích hợp `@jitsi/react-sdk` và `YouTube IFrame API` mượt mà. Không gọi API ping liên tục để lưu tiến độ mà chỉ lưu khi video kết thúc. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | 🔴 Có lỗi | Logic xóa bài giảng (Soft Delete) đang xóa cứng file trên Cloudinary. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/lessons` | `verifyUser` | Tạo bài giảng + Upload file | 🟢 Hoạt động |
| GET | `/api/lessons/class/:classId` | `verifyUser` | Lấy danh sách | 🟢 Hoạt động |
| PATCH | `/api/lessons/:id` | `verifyUser` | Cập nhật bài giảng | 🟢 Hoạt động |
| DELETE| `/api/lessons/:id` | `verifyUser` | Xóa bài giảng | 🔴 Lỗi Logic |
| POST | `/api/lesson-progress`| `verifyUser` | Cập nhật tiến độ | 🟢 Hoạt động |

## 4. Lỗi phát hiện

### [🟠 Trung bình] Lỗi thiết kế Soft Delete làm mất dữ liệu Cloudinary
- **Mô tả:** Trong `lesson.controller.js` ở hàm `deleteLesson`, hệ thống gọi `lesson.softDelete(userId)` để thực hiện xóa mềm (chỉ đổi cờ `isDeleted = true` trong database để có thể khôi phục lại từ thùng rác). TUY NHIÊN, đoạn code phía trên lại gọi `cloudinary.uploader.destroy()` để xóa cứng vĩnh viễn các file đính kèm trên Cloudinary. 
- **Vị trí:** `Backend/src/modules/lesson/lesson.controller.js:158`
- **Ảnh hưởng:** Nếu Admin/Giáo viên khôi phục bài giảng từ thùng rác, bài giảng sẽ mất toàn bộ file đính kèm (URL trỏ tới file trên Cloudinary bị 404). 
- **Đề xuất:** Xóa lệnh `destroy` Cloudinary khỏi hàm `deleteLesson` (soft delete), và chuyển đoạn code dọn rác đó sang luồng `permanentDeleteLesson` (hard delete).

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Cập nhật tiến độ học | Chỉ gọi 1 lần khi xem xong | Gọi thủ công hoặc chờ `onVideoEnded`. | Chưa kiểm chứng |
| 2 | Chặn truy cập | GV không thuộc lớp không xóa được | Bắt lỗi bằng `checkClassTeacherOwnership` 403. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Frontend lưu giữ token và state cho Youtube IFrame Player rất thủ công qua `window.YT`. Trong tương lai có thể cân nhắc thư viện `react-youtube` hoặc `react-player` để component sạch hơn và tránh memory leaks.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Tách logic xóa Cloudinary khỏi Soft Delete trong `lesson.controller.js` | 🔴 Cao | 1h | BE |
