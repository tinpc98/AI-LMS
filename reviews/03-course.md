# 03 - Khóa học (Course)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Khóa học (Course) quản lý danh mục khóa học chuẩn của trung tâm. Đây là module cơ sở để từ đó tạo ra các Lớp học (Class). Chức năng CRUD và phân quyền đã hoàn chỉnh, sử dụng `useAdminListQuery` trên FE tương tự như module Admin và Lớp học.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Các trường dữ liệu đầy đủ (`tuitionFee`, `durationWeeks`, `totalLessons`). |
| REST API | ✅ Hoàn thành | Đầy đủ tính năng lấy danh sách, thùng rác, tạo, sửa, xóa, đổi trạng thái. |
| Phân quyền | ✅ Hoàn thành | Admin toàn quyền quản lý, Teacher/Student chỉ có thể đọc. |
| Validation | ✅ Hoàn thành | Tên khóa học tối thiểu 3 ký tự, enum Subject chuẩn chỉnh. |
| Frontend - Admin | ✅ Hoàn thành | Bảng dữ liệu chuẩn xác, không bị lỗi nuốt dữ liệu hay hiển thị Mock. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Bóc response tốt, thông báo lỗi rõ ràng. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| GET | `/api/courses` | `verifyUser` | Lấy danh sách khóa học | 🟢 Hoạt động |
| POST | `/api/courses` | `verifyUser`, `isAdmin` | Tạo khóa mới | 🟢 Hoạt động |
| GET | `/api/courses/trash`| `verifyUser`, `isAdmin`| Thùng rác | 🟢 Hoạt động |
| DELETE| `/api/courses/:id`| `verifyUser`, `isAdmin`| Đưa vào thùng rác | 🟢 Hoạt động |
| PATCH | `/api/courses/:id/restore`| `verifyUser`, `isAdmin`| Khôi phục | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi nghiêm trọng.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Bóc tách response | Lấy mảng dữ liệu chính xác | `res.data.data` được parse đúng bởi hook | Chưa kiểm chứng |
| 2 | Phân quyền Backend | Chỉ Admin tạo/sửa | Bọc middleware `isAdmin` trong router | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- **Hard-code Enum Subject:** Danh sách Môn học (Subject) hiện đang được hard-code cứng trong Schema `["Mathematics", "Physics", "Chemistry", "English", "Literature"]`. Nếu trung tâm mở rộng dạy thêm môn Sinh học (Biology) hoặc Lịch sử (History), sẽ cần cập nhật code Backend và Frontend. Thay vào đó, nên tạo một table `Subject` riêng.
- **Upload Ảnh Thumbnail:** Hiện tại `thumbnail` chỉ lưu dạng String (URL), nhưng chưa có API để thực sự Upload hình ảnh lên server/cloud như Cloudinary cho module này (module Lớp học thì đã có).

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Thêm API upload thumbnail cho Course | 🔵 Thấp | 2h | BE |
| 2 | Chuyển Subject từ Enum sang Table riêng | 🟡 Trung bình | 8h | Cả hai |
