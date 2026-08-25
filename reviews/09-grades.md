# 09 - Bảng điểm (Grades)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟡 Cần cải thiện

## 1. Tóm tắt

Module Bảng điểm quản lý và tổng hợp điểm số từ nhiều nguồn (Điểm danh, Bài tập, Thi giữa kỳ/cuối kỳ) và các cột điểm nhập tay. Hệ thống tính toán GPA, có giao diện bảng điểm cho giáo viên (Grade Matrix) và tiến độ cho học sinh. Cơ bản ổn định, nhưng có vài điểm chưa đồng nhất giữa Frontend và Backend.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Đầy đủ schema (`grade.model.js`), có softDelete, index đúng (`classId`, `studentId`, v.v.). |
| REST API | ✅ Hoàn thành | Đầy đủ endpoint lấy điểm lớp, cá nhân, GPA và cập nhật điểm. |
| Phân quyền | ✅ Hoàn thành | Check ownership cho giáo viên, học sinh chỉ xem được điểm của mình. |
| Validation | ⚠️ Một phần | Có validate `ObjectId` ở Controller, nhưng có sự chênh lệch scale điểm giữa FE và BE. |
| Frontend - Student | ✅ Hoàn thành | `GradesTab.tsx` có giao diện đẹp, biểu đồ thống kê, có check lỗi tải dữ liệu. |
| Frontend - Teacher | ⚠️ Một phần | Bảng điểm dạng ma trận `TeacherGradebookTab.tsx`, nhập điểm hoạt động, nhưng tính năng Export Excel/PDF đang disable. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | BE bọc `try/catch` trả về 500/400. FE có báo lỗi khi fetch API thất bại. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/grades/` | `verifyUser`, `isTeacher` | Cập nhật điểm tay | 🟢 Hoạt động |
| GET | `/api/grades/class/:classId` | `verifyUser`, `isTeacher` | Bảng điểm ma trận cho gv | 🟢 Hoạt động |
| GET | `/api/grades/student/:studentId` | `verifyUser` | Bảng điểm chi tiết hs | 🟢 Hoạt động |
| GET | `/api/grades/gpa/...` | `verifyUser` | Lấy GPA cá nhân | 🟢 Hoạt động |

## 4. Lỗi phát hiện

### [🟡 Trung bình] Lệch scale điểm (0-10 vs 0-100) giữa FE và BE
- **Mô tả:** Frontend (`GradeDetailDrawer.tsx`) giới hạn người dùng nhập điểm từ 0-10 (`min: 0, max: 10`). Trong khi đó, Schema Backend (`grade.model.js`) cấu hình `max: [100, ...]`. Tuy không gây crash (vì 10 < 100), nhưng logic điểm hệ 10 hay 100 chưa được thống nhất rõ ràng.
- **Vị trí:** `Frontend/src/features/class/components/classroom/GradeDetailDrawer.tsx:192` và `Backend/src/modules/grade/grade.model.js:30`.
- **Ảnh hưởng:** Giáo viên nhập điểm 10 nhưng nếu BE coi là 10/100 thì học sinh sẽ trượt, hoặc nếu BE coi là 10/10 thì schema quy định 100 là dư thừa/sai ý nghĩa.
- **Đề xuất:** Cần thống nhất toàn hệ thống dùng thang 10 hay thang 100, sau đó đồng bộ validation giữa FE và Schema BE.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | FE xử lý response trả về | Không bị R1 (Bóc sai tầng) | Có `response.data.data ?? response.data`. | Chưa kiểm chứng |
| 2 | So sánh ObjectId backend | Không bị R2 (So sánh với string) | Có ép `.toString()` trong `grade.service.js`. | Chưa kiểm chứng |
| 3 | FE bắt lỗi nếu API xịt | Báo lỗi đàng hoàng | Có `Alert` bắt error ở `GradesTab.tsx`. | Chưa kiểm chứng |

*Lưu ý: Các test trên thực hiện phân tích mã tĩnh (static analysis), chưa chạy thật (runtime).*

## 6. Nợ kỹ thuật

- **Hard-code chức năng Export:** Trong `TeacherGradebookTab.tsx`, 2 nút Export Excel và PDF đang bị disable kèm tooltip "Chưa hỗ trợ API". Cần implement BE cho tính năng này.
- **Chưa bọc transaction:** Việc `upsertGrade` khi chấm nhiều điểm tay cùng lúc trên Drawer gọi API độc lập từng cột điểm (`Promise.all`), nếu có lỗi giữa chừng sẽ dẫn đến lưu 1 nửa, nên làm bulk upsert trên BE.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Thống nhất thang điểm 10 hay 100, sửa BE hoặc FE | 🟠 Cao | 1h | Cả hai |
| 2 | Triển khai API Bulk Upsert điểm để tránh spam request | 🟡 Trung bình | 3h | BE |
| 3 | Thêm chức năng Export Excel/PDF | 🔵 Thấp | 4h | BE & FE |
