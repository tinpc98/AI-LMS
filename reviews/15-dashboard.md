# 15 - Dashboard (Bảng điều khiển)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Dashboard cung cấp cái nhìn tổng quan về hệ thống. Bao gồm 2 phần: Admin Dashboard (Thống kê hệ thống) và Teacher Dashboard (Quản lý tiến độ lớp học, thông báo, bài tập, lớp live). 

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ➖ Không áp dụng | Module báo cáo, chỉ đọc dữ liệu. |
| REST API | ✅ Hoàn thành | Backend `dashboard.service.js` tổng hợp metrics cho Admin. |
| Phân quyền | ✅ Hoàn thành | Admin chỉ gọi API admin, Teacher tự fetch theo context. |
| Validation | ➖ Không áp dụng | |
| Frontend - All Roles | ✅ Hoàn thành | Đã xóa 100% Mock data cũ (275 dòng). Sử dụng API thật. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Teacher Dashboard áp dụng Error Boundary cấp network (API thông báo rớt không làm sập Dashboard lớp học). Lỗi được catch và swallow an toàn. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| GET | `/api/dashboard/admin` | `verifyUser`, `isAdmin` | Thống kê Admin | 🟢 Hoạt động |
| GET | `(Fetch song song 4 endpoints)` | `verifyUser`, `isTeacher`| Cấu trúc Teacher Dashboard | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không có lỗi cấu trúc. Module này đã được refactor rất tốt so với phiên bản trước đây (phiên bản chạy hoàn toàn bằng Mock data). 

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Lỗi cục bộ khi tải Dashboard Teacher | Chỉ fail widget đó | Áp dụng `Promise.all` kết hợp `.catch(() => null)`. | Chưa kiểm chứng |
| 2 | Cascading Render / N+1 Request | Hạn chế spam API | Có `MAX_CLASSES_TO_EXPAND = 5` giới hạn việc query bài tập/live cho từng lớp. | Chưa kiểm chứng |
| 3 | Bóc response nhiều tầng (R1) | Xử lý linh hoạt | Dùng hàm `unwrapList` hỗ trợ nhiều structure khác nhau. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Với việc fetch N+1 (gọi API lấy bài tập, lấy phiên Live theo từng `class._id`), ngay cả khi giới hạn `MAX_CLASSES_TO_EXPAND = 5`, thì cách thiết kế này vẫn không tối ưu về mặt hiệu năng. 
- Thay vì FE phải gọi 11 requests để dựng Dashboard Teacher (1 class list, 1 announcement, 5 bài tập, 5 live session), nên có 1 API tổng `/api/dashboard/teacher` ở Backend tương tự như Admin. Backend tổng hợp query song song trong DB sẽ nhanh hơn nhiều so với việc bắn 11 luồng HTTP từ Browser.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Gộp luồng Teacher Dashboard thành 1 API `/api/dashboard/teacher` duy nhất | 🟡 Trung bình | 6h | Cả hai |
