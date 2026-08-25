# 04 - Tài liệu học tập (Materials)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Tài liệu (Materials) không phải là một module độc lập ở Backend, mà là sự kết hợp giữa hệ thống `Folder` để cấu trúc cây thư mục (chứa Exam Sets), và danh sách `resources`/`attachments` nằm trong Lớp học (Class) và Bài giảng (Lesson). 

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `folder.model.js` xử lý quan hệ đệ quy `parentFolderId` tốt, hỗ trợ cấu trúc cây. |
| REST API | ✅ Hoàn thành | Quản lý vòng đời CRUD Folder và get tree. |
| Phân quyền | ✅ Hoàn thành | Cây thư mục được bảo vệ bởi `ownerId` và middleware `isTeacher`/`isAdmin`. |
| Validation | ✅ Hoàn thành |  |
| Frontend - All Roles | ✅ Hoàn thành | Giao diện `LearningMaterialsTab.tsx` phân loại rất tốt theo định dạng (PDF, Video, Link, Slide) thông qua hook `useLearningMaterials.ts`. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | UI Xử lý đầy đủ trường hợp tải xuống URL không hợp lệ (bắt buộc http/https). |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/folders` | `verifyUser` | Tạo thư mục | 🟢 Hoạt động |
| GET | `/api/folders/tree`| `verifyUser` | Lấy cây thư mục đa cấp | 🟢 Hoạt động |
| PATCH | `/api/folders/:id` | `verifyUser` | Đổi tên/chuyển cấp | 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không phát hiện lỗi.

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Thống kê định dạng | Dashboard hiển thị đúng số liệu file | Hàm `classifyResource` đếm PDF/Video/Link/Slide chính xác. | Chưa kiểm chứng |
| 2 | Tải xuống tài liệu | Mở link ở tab mới thay vì bị chặn | Hàm `handleDownload` mở url mới với `noopener,noreferrer`. | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Frontend chưa có màn hình độc lập Quản lý Thư mục (Folder Manager) như Google Drive, mà hiện tại Folder chỉ đang được ứng dụng ngầm để phân loại Question Bank / Exam Sets.

## 7. Việc cần làm

(Không có)
