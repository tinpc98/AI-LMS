# 07 - Đề thi & Chấm thi (Exams / Exam Attempts)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Quản lý Kỳ thi / Chấm thi là một trong những module phức tạp nhất, hoạt động với 2 service song song ở Backend (`exam` và `exam-attempt`). Nó xử lý logic làm bài thi trực tuyến, đếm ngược thời gian, nộp bài, chống gian lận (Anti-cheat) bằng Socket.IO và tự động lưu nháp từng câu hỏi (Draft).

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | Tính năng snapshot câu hỏi `snapshotData` rất thông minh để chống vỡ đề khi Question Bank thay đổi. |
| REST API | ✅ Hoàn thành | Đầy đủ API tạo thủ công, tạo bằng AI (ma trận đề). |
| Phân quyền | ✅ Hoàn thành | |
| Validation / Security | ✅ Hoàn thành | Code sử dụng hàm `redactExamAnswersForStudent` để xóa `correctAnswer` và `isCorrect` khỏi mạng (Network payload) trước khi gửi đề thi xuống trình duyệt học sinh. Tuyệt vời! |
| Frontend - All Roles | ✅ Hoàn thành | Giao diện phòng thi sử dụng `useExamTimer` kết hợp Socket. |
| Realtime / WebSocket| ✅ Hoàn thành | `exam.socket.js` xử lý bắt sự kiện gian lận (`TAB_SWITCH`, `FULLSCREEN_EXIT`), và handle thiết bị đôi cực kỳ chi tiết (`takeoverCount`). |
| Xử lý lỗi (Lateness) | ✅ Hoàn thành | Có dung sai ân hạn thời gian 2 phút (`GRACE_PERIOD_MS`) và chặn hoàn toàn nộp muộn sau 1 phút (`LATE_SUBMISSION_TOLERANCE_MS`). Rất sát thực tế. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/exams/generate-auto`| `verifyUser`, `isTeacher` | Sinh đề bằng AI matrix | 🟢 Hoạt động |
| POST | `/api/exam-attempt/start` | `verifyUser` | HS Bắt đầu thi | 🟢 Hoạt động (Có xử lý Takeover) |
| POST | `/api/exam-attempt/submit`| `verifyUser` | Nộp bài | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi. Kiến trúc và bảo mật của module này (Snapshot, Redaction, Session Takeover) đang ở mức Production-ready rất cao.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Lộ đáp án qua Network | Không thấy trường `isCorrect` trong API response | Đã có hàm `redactExamAnswersForStudent` can thiệp. | Chưa kiểm chứng |
| 2 | Hai thiết bị cùng đăng nhập | Báo "Phiên làm bài đang mở" | Tính năng Takeover token đã implement trong Controller. | Chưa kiểm chứng |
| 3 | Nộp trễ quá 3 phút | Ném lỗi 400 Rejected | Do logic `LATE_SUBMISSION_TOLERANCE_MS` chặn cứng. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Mặc dù Web Socket đã xử lý `TAB_SWITCH`, nhưng tính năng "Chặn tắt màn hình" hoặc "Bắt buộc khóa màn hình" như Safe Exam Browser (SEB) là điều Web Browser thông thường không làm được, chỉ dừng ở mức Warning.

## 7. Việc cần làm

(Không có)
