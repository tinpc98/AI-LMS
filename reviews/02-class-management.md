# 02 - Quản lý Lớp học (Class Management)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟡 Cần cải thiện

## 1. Tóm tắt

Module Quản lý lớp học chứa cấu trúc dữ liệu phức tạp (nhúng danh sách học sinh, tài liệu học tập, trọng số điểm, thời khóa biểu). Backend xử lý rất tốt các ràng buộc nghiệp vụ (tự tính `currentStudents` bằng pre-validate hook, validate magic-bytes khi upload). Tuy nhiên, tầng Frontend đang lạm dụng Mock Data gây nguy hiểm cho môi trường Production.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `class.model.js` quy mô lớn, thiết kế schema phụ (subdocument) hợp lý. Cập nhật số lượng học sinh tự động. |
| REST API | ✅ Hoàn thành | Cung cấp đầy đủ tính năng: CRUD lớp học, upload file tài nguyên có bảo mật, gán GV/HS. |
| Phân quyền | ✅ Hoàn thành | Admin toàn quyền, Teacher được cấp quyền trên tài nguyên và học sinh trong lớp mình dạy. |
| Validation | ✅ Hoàn thành | Có middleware `validateMagicBytes` rất tốt để chặn mã độc giả mạo file tài liệu. |
| Frontend - Admin | ⚠️ Một phần | Đã dùng custom hooks để fetch danh sách, nhưng lại catch error và hiển thị Mock Data. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ⚠️ Một phần | FE nuốt lỗi khi lấy danh sách GV/Khóa học, che giấu lỗi bằng dữ liệu giả. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| GET | `/api/classes` | `verifyUser` | Lấy danh sách lớp | 🟢 Hoạt động |
| POST | `/api/classes` | `verifyUser`, `isAdmin` | Tạo lớp mới | 🟢 Hoạt động |
| PATCH | `/api/classes/:id/delete` | `verifyUser`, `isAdmin`| Soft delete lớp học | 🟢 Hoạt động |
| POST | `/api/classes/:id/resources/upload` | `verifyUser`, `isTeacher`, `upload`, `magicBytes` | Upload file tài nguyên | 🟢 Hoạt động |
| GET | `/api/classes/:id/resources/:resourceId/access`| `verifyUser` | Ký URL truy cập file | 🟢 Hoạt động |
| PATCH | `/api/classes/:id/assign-teacher` | `verifyUser`, `isAdmin`| Phân công GV | 🟢 Hoạt động |
| POST | `/api/classes/:id/students` | `verifyUser`, `isAdmin`| Ghi danh HS | 🟢 Hoạt động |

## 4. Lỗi phát hiện

### [🟠 Trung bình] Frontend nuốt lỗi API và trả về Mock Data
- **Mô tả:** Trong `Frontend/src/features/class/classService.ts`, hàm `getCourseOptions` và `getTeacherOptions` khi gọi API lỗi (`catch { ... }`) đã cố tình trả về `mockCourses` và `mockUsers`. 
- **Vị trí:** `Frontend/src/features/class/classService.ts`
- **Ảnh hưởng:** Nếu API down, Admin khi tạo lớp vẫn thấy danh sách GV và khóa học (dữ liệu giả mạo), dẫn đến chọn nhầm, lưu thất bại hoặc hiển thị sai lệch ở Production.
- **Đề xuất:** Cần throw error thẳng lên UI để hiển thị Toast thông báo lỗi, xóa bỏ hoàn toàn `import { mockCourses }` trên Production.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Upload tài liệu | File an toàn mới được lưu | `validateMagicBytes` bắt chặt định dạng file | Chưa kiểm chứng |
| 2 | Giới hạn học sinh | Không vượt maxStudents | Hook `pre('validate')` kiểm tra tự động | Chưa kiểm chứng |
| 3 | Thêm GV/HS | Payload đúng cấu trúc | Các endpoint PATCH/POST chuyên biệt xử lý | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Frontend giữ lại Mock data từ giai đoạn đầu phát triển. Cần dọn dẹp sạch sẽ các thư mục/file `mock` trên toàn bộ dự án nếu dự án đã có API thật.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Xóa cơ chế fallback mock data trong `classService.ts` và bắt lỗi hiển thị đúng trên form. | 🔴 Cao | 1h | FE |
