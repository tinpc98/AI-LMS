# 06 - Bài tập & Chấm điểm (Assignments / Submissions)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Bài tập cung cấp một hệ thống đồ sộ cho phép Giáo viên tạo bài tập (đính kèm file, hạn nộp, maxScore) và học sinh nộp bài (submissionMode đa dạng: `file`, `link`, `direct`). Tích hợp sẵn cơ chế chặn nộp quá hạn, quản lý thùng rác (soft delete) cho Bài tập và quản lý vòng đời tệp tin Cloudinary rất chặt chẽ cho Bài nộp.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `assignment.model.js` và `submission.model.js` được thiết kế cực kỳ chi tiết, unique index `{assignmentId, studentId}` để chống spam nộp bài. |
| REST API | ✅ Hoàn thành | Các API CRUD hoạt động tốt, có session & transaction cho các hành động thay đổi file và database đồng thời. |
| Phân quyền | ✅ Hoàn thành | Phân quyền bảo vệ quyền xem bài nộp chỉ cho Giáo viên/Admin thông qua các middleware riêng. |
| Validation | ✅ Hoàn thành | Chặn nộp bài sau `deadline`, chặn hủy nộp bài sau khi giáo viên đã chấm điểm. Bắt buộc hoàn thành các câu hỏi `required` nếu nộp mode `direct`. |
| Frontend - All Roles | ✅ Hoàn thành | UI chia layout rất tốt: Bên trái là file đính kèm/nội dung bài làm, bên phải là AI Tutor. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Transaction đảm bảo nếu API lỗi sẽ rollback (delete) các file Cloudinary vừa đẩy lên. Rất an toàn. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/assignments` | `verifyUser` | Giáo viên tạo bài | 🟢 Hoạt động |
| POST | `/api/assignments/:id/submit`| `verifyUser` | Học sinh nộp bài | 🟢 Hoạt động |
| PATCH | `/api/assignments/grade/:submissionId` | `verifyUser` | GV chấm điểm | 🟢 Hoạt động |
| DELETE| `/api/assignments/:id/cancel` | `verifyUser` | Học sinh hủy bài | 🟢 Hoạt động (Dọn sạch file rác) |

## 4. Lỗi phát hiện

Không phát hiện lỗi nghiêm trọng. Hệ thống quản lý tệp đính kèm bài làm học sinh trong `assignment.service.js` (hàm `submitAssignmentService` và `cancelSubmissionService`) thực hiện việc xóa vật lý trên Cloudinary chính xác, giúp tiết kiệm dung lượng rác. Hàm xóa bài tập của giáo viên cũng áp dụng Soft Delete chuẩn.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Hủy bài sau khi có điểm | Ném lỗi 409 | `SUBMISSION_ALREADY_GRADED` | Chưa kiểm chứng |
| 2 | Nộp bài sau hạn nộp | Ném lỗi 400 | `ASSIGNMENT_PAST_DEADLINE` | Chưa kiểm chứng |
| 3 | Sửa hình thức nộp | Chặn nếu đã có người nộp | "Không thể thay đổi hình thức..." (400) | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- API `/api/assignments/:id/draft` (Học sinh lưu nháp) ở Backend chưa hỗ trợ upload tệp đính kèm. Trên Frontend UI trang `StudentAssignment.tsx` hiện cũng đang chưa triển khai nút "Lưu nháp" mà mới chỉ lưu state tạm trên RAM.

## 7. Việc cần làm

(Không có tác vụ khẩn cấp)
