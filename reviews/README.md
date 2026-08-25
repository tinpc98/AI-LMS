# Hồ sơ Review dự án EduSpace

**Cập nhật lần cuối:** 2026-08-18

## Tổng quan tiến độ

| # | Module | Trạng thái | 🔴 | 🟠 | 🟡 | 🔵 | Ngày review | Chi tiết |
|---|---|---|---|---|---|---|---|---|
| 09 | Bảng điểm | 🟡 Cần cải thiện | | 1 | 1 | | 2026-08-18 | [link](./09-grades.md) |
| 10 | Điểm danh | 🟢 Ổn định | | | | | 2026-08-18 | [link](./10-attendance.md) |
| 01 | Xác thực & Người dùng | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./01-auth-users.md) |
| 16 | Admin | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./16-admin.md) |
| 02 | Lớp học | 🟡 Cần cải thiện | | 1 | | | 2026-08-18 | [link](./02-class-management.md) |
| 03 | Khóa học | 🟢 Ổn định | | | 1 | | 2026-08-18 | [link](./03-course.md) |
| 08 | Ngân hàng câu hỏi | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./08-question-bank.md) |
| 13 | Phòng học Live | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./13-live-room.md) |
| 14 | Tính năng AI | 🟡 Cần cải thiện | 1 | | | | 2026-08-18 | [link](./14-ai-features.md) |
| 15 | Dashboard | 🟢 Ổn định | | | 1 | | 2026-08-18 | [link](./15-dashboard.md) |
| 04 | Tài liệu | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./04-materials.md) |
| 05 | Bài giảng | 🟡 Cần cải thiện | 1 | | | | 2026-08-18 | [link](./05-lectures.md) |
| 06 | Bài tập | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./06-assignments.md) |
| 07 | Chấm thi | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./07-exams.md) |
| 11 | Thông báo | 🟡 Cần cải thiện | 1 | | | | 2026-08-18 | [link](./11-notifications.md) |
| 12 | Chat | 🟢 Ổn định | | | | 1 | 2026-08-18 | [link](./12-chat.md) |

## Thống kê toàn dự án

- Module đã review: 16 / 16
- Module 🟢 ổn định: 11
- Module 🟡 cần cải thiện: 5
- Module 🔴 có lỗi nghiêm trọng: 0
- Module ⚫ chưa triển khai: 0
- Tổng số lỗi: 🔴 2 · 🟠 2 · 🟡 5 · 🔵 9

## Lỗi nghiêm trọng cần xử lý ngay

| # | Module | Lỗi | Ảnh hưởng | Link |
|---|---|---|---|---|
| 1 | 14-AI | AI Prompt Injection | Học viên bypass rubric chấm điểm | [link](./14-ai-features.md) |
| 2 | 05-Bài giảng | Xóa cứng tệp Cloudinary | Mất tệp vĩnh viễn khi xóa mềm bài giảng | [link](./05-lectures.md) |

## Lỗi tái phát — thống kê toàn dự án

| Mã | Lỗi | Số module mắc | Danh sách module |
|---|---|---|---|
| R1 | Bóc response sai tầng | 0 | |
| R2 | So sánh ObjectId với string | 0 | |
| R3 | Sai HTTP method giữa FE và BE | 0 | |
| R4 | Hard-code đường dẫn route | 0 | |
| R5 | Component nhân bản cho hai portal | 0 | |
| R6 | Thiếu tiền tố `/api` trong lời gọi | 0 | |
| R7 | Text vỡ do thiếu `nowrap` hoặc `break-word` | 0 | |
| R8 | Nút mất màu hoặc mất chữ | 0 | |
| R9 | Trạng thái lưu ở client thay vì server | 0 | |
| R10 | Hiển thị `0` thay vì "chưa có dữ liệu" | 0 | |
| R11 | Nút dẫn tới thất bại chắc chắn | 0 | |
| R12 | Thiếu validation ở backend | 0 | |
| R13 | Biến chưa khai báo trong JSX | 0 | |
| R14 | Import type thiếu từ khóa `type` | 0 | |
| R15 | Vỡ mã UTF-8 (tên file, tên người) | 0 | |
| R16 | Thiếu cleanup trong `useEffect` | 0 | |
| R17 | Placeholder che dữ liệu thiếu | 0 | |
| R18 | Số liệu lệch giữa các nơi hiển thị | 0 | |

## Đề xuất ưu tiên

*(Sẽ cập nhật sau khi hoàn tất các đợt review)*
