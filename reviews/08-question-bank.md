# 08 - Ngân hàng câu hỏi (Question Bank / Exam Set)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module này đóng vai trò lõi cho hệ thống đánh giá. Thay vì lưu câu hỏi độc lập, hệ thống nhóm các câu hỏi dưới dạng subdocument trong model `ExamSet`. Module cung cấp cơ chế mạnh mẽ: Quản lý phiên bản (Versioning), Import từ Excel, và Chia sẻ bộ câu hỏi (Share/Revoke) giữa các giáo viên.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `examSet.model.js` nhúng `questionSchema`. Có tính toán metrics tự động (tổng câu, tổng điểm) bằng middleware. |
| REST API | ✅ Hoàn thành | Đầy đủ API: Tạo phiên bản mới, duplicate, khôi phục từ thùng rác, và chia sẻ. |
| Phân quyền | ✅ Hoàn thành | Phân quyền sâu: View / Edit dựa trên `examSetAccess.middleware.js`. |
| Validation | ✅ Hoàn thành | Ràng buộc cấu trúc rubric, số điểm tối đa, và có `excelFileFilter` kiểm tra mã magic bytes. |
| Frontend | ✅ Hoàn thành | (Phân tích tĩnh) Hỗ trợ Import Excel và quản lý phiên bản. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Map lỗi Multer (quá dung lượng) sang mã HTTP 413 chuẩn. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/exam-sets` | `verifyUser` | Tạo bộ câu hỏi | 🟢 Hoạt động |
| POST | `/api/exam-sets/import-excel` | `verifyUser`, `isTeacher`, `upload` | Import Excel | 🟢 Hoạt động |
| POST | `/api/exam-sets/:id/duplicate`| `requireExamSetEditAccess` | Nhân bản | 🟢 Hoạt động |
| POST | `/api/exam-sets/:id/shares` | `requireExamSetEditAccess` | Chia sẻ bộ đề | 🟢 Hoạt động |
| PATCH | `.../shares/:shareId/revoke`| `requireExamSetEditAccess` | Thu hồi quyền | 🟢 Hoạt động |
| PATCH | `/api/exam-sets/:id/questions/reorder` | `requireExamSetAccess("EDIT")` | Sắp xếp lại thứ tự| 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không có lỗi cấu trúc lớn.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Upload Excel quá dung lượng | Báo lỗi 413 | Bắt đúng lỗi Multer `LIMIT_FILE_SIZE` | Chưa kiểm chứng |
| 2 | Cập nhật tổng điểm | Cập nhật khi thêm/xóa câu | `recalculateExamSetMetrics` chạy trong pre-save | Chưa kiểm chứng |
| 3 | Người được chia sẻ tạo bản sao | Ngăn cấp quyền chia sẻ tiếp | Rule "shared user không được share tiếp" ở router | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Vì toàn bộ `questions` được lưu dưới dạng Subdocument trong `ExamSet`, mỗi phiên bản (Version) mới sẽ Duplicate toàn bộ mảng câu hỏi này. Với bộ đề 100 câu và 10 phiên bản, dung lượng BSON có thể tăng lên. Cần giới hạn số câu hỏi mỗi bộ (đề nghị < 200 câu).

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Phân trang / Lazy load danh sách câu hỏi ở Frontend nếu số lượng câu hỏi > 100 | 🔵 Thấp | 4h | FE |
