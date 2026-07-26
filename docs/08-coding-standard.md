# Quy chuẩn Lập trình Dự án AI-LMS (Project Coding Standards)

Tài liệu quy định các chuẩn mực lập trình (Coding Conventions), quy tắc đặt tên, cấu trúc thư mục, quy trình Git và xử lý lỗi cho toàn bộ đội ngũ phát triển dự án AI-LMS.

---

## 📑 MỤC LỤC
1. [Quy tắc Đặt tên (Naming Conventions)](#1-quy-tắc-đặt-tên-naming-conventions)
2. [Quy chuẩn React 19 & TypeScript (Frontend Standards)](#2-quy-chuẩn-react-19--typescript-frontend-standards)
3. [Quy chuẩn Node.js & Express (Backend Standards)](#3-quy-chuẩn-nodejs--express-backend-standards)
4. [Quy chuẩn Thiết kế MongoDB & Mongoose](#4-quy-chuẩn-thiết-kế-mongodb--mongoose)
5. [Quy chuẩn Thiết kế RESTful API (API Conventions)](#5-quy-chuẩn-thiết-kế-restful-api-api-conventions)
6. [Quy chuẩn Quản lý Mã nguồn Git (Git Conventions)](#6-quy-chuẩn-quản-lý-mã-nguồn-git-git-conventions)
7. [Quy chuẩn Xử lý Lỗi (Error Handling Conventions)](#7-quy-chuẩn-xử-lý-lỗi-error-handling-conventions)
8. [Quy chuẩn Ghi Nhật ký (Logging Conventions)](#8-quy-chuẩn-ghi-nhật-ký-logging-conventions)

---

## 1. QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)

| Đối tượng | Quy tắc | Ví dụ Minh họa |
| :--- | :--- | :--- |
| **Files Component React** | `PascalCase.tsx` | `LearningScoreCard.tsx`, `StudentSidebar.tsx` |
| **Files Utility / Services** | `camelCase.ts` / `camelCase.js` | `learningDashboard.service.ts`, `auth.services.js` |
| **Files Controller / Route** | `camelCase.controller.js` / `camelCase.routes.js` | `assignment.controller.js`, `class.routes.js` |
| **Files Mongoose Model** | `camelCase.model.js` / `singular` | `user.models.js`, `class.model.js`, `exam.model.js` |
| **Interfaces / Types TS** | `PascalCase` (Prefix `I` cho Interface) | `IStudentClass`, `LearningInsight` |
| **Biến & Hàm (Variables/Fn)**| `camelCase` | `fetchDashboardData`, `calculateLearningScore` |
| **Hằng số (Constants)** | `UPPER_SNAKE_CASE` | `MAX_STUDENTS_PER_CLASS`, `JWT_EXPIRES_IN` |
| **CSS Classes** | `kebab-case` hoặc Antd Tokens | `dashboard-container`, `user-dropdown-trigger` |

---

## 2. QUY CHUẨN REACT 19 & TYPESCRIPT (FRONTEND STANDARDS)

- **Functional Components**: 100% sử dụng Functional Components với `React.FC<Props>`.
- **Performance Optimization**: Bọc các Component UI độc lập bằng `React.memo`, sử dụng `useCallback` cho các handler callback truyền xuống con và `useMemo` cho các phép tính toán tốn chi phí.
- **Strict TypeScript**: Không sử dụng `any` trừ trường hợp xử lý dữ liệu thô chưa rõ schema. Tất cả Props phải có Interface/Type định nghĩa đầy đủ.
- **Component File Structure Order**:
  1. Import Thư viện ngoài (React, Ant Design, Icons).
  2. Import Components nội bộ, Hooks, Services.
  3. Definition Interface Props.
  4. Component Export (`React.memo`).

---

## 3. QUY CHUẨN NODE.JS & EXPRESS (BACKEND STANDARDS)

- **ES Modules**: 100% sử dụng chuẩn ES Modules (`import`/`export`), không dùng `require()`.
- **Async/Await**: Sử dụng `async/await` kết hợp `try...catch` bọc toàn bộ các hàm bất đồng bộ trong Controller.
- **Response Format**: Trả về dữ liệu chuẩn thông qua utility `sendSuccess(res, message, data, pagination, statusCode)`.

---

## 4. QUY CHUẨN THIẾT KẾ MONGODB & MONGOOSE

- **Soft Delete Plugin**: Mọi Schema mới bắt buộc phải nhúng `schema.plugin(softDeletePlugin)` để tự động hỗ trợ xóa mềm.
- **Indexes Required**: Tự động đánh Index cho các trường thường xuyên dùng trong câu lệnh `find()`, `sort()`, hoặc `populate()` (vd: `classId`, `teacherId`, `studentId`, `isDeleted`, `createdAt`).
- **Pre-save Hooks**: Sử dụng pre-save hook để tự động hóa validate (vd: validate tổng điểm bài thi bằng 10.0 điểm).

---

## 5. QUY CHUẨN THIẾT KẾ RESTFUL API (API CONVENTIONS)

- **Endpoint Naming**: Dùng danh từ số nhiều, chữ viết thường, ngăn cách bằng dấu gạch ngang (`kebab-case`).
  - GET `/api/classes` -> Lấy danh sách lớp
  - POST `/api/assignments/:id/submit` -> Nộp bài tập
- **HTTP Status Codes**:
  - `200 OK`: Truy vấn / Cập nhật thành công.
  - `201 Created`: Tạo mới tài nguyên thành công.
  - `400 Bad Request`: Lỗi dữ liệu đầu vào / Validation Error.
  - `401 Unauthorized`: Chưa đăng nhập / Token không hợp lệ.
  - `403 Forbidden`: Không có quyền (Sai Role / Tài khoản Inactive / Soft Deleted).
  - `404 Not Found`: Tài nguyên không tồn tại.
  - `500 Internal Server Error`: Lỗi hệ thống Backend.

---

## 6. QUY CHUẨN QUẢN LÝ MÃ NGUỒN GIT (GIT CONVENTIONS)

### Quy tắc Đặt tên Branch:
- `feature/<feature-name>`: Phát triển tính năng mới (vd: `feature/ai-quiz-generator`).
- `bugfix/<bug-name>`: Sửa lỗi (vd: `bugfix/student-dashboard-blank-screen`).
- `hotfix/<fix-name>`: Sửa lỗi khẩn cấp trên Production.

### Quy tắc Commit Message (Conventional Commits):
- `feat: <mô tả>`: Thêm tính năng mới.
- `fix: <mô tả>`: Sửa lỗi.
- `refactor: <mô tả>`: Tái cấu trúc code nhưng không đổi tính năng.
- `docs: <mô tả>`: Cập nhật tài liệu thiết kế.

---

## 7. QUY CHUẨN XỬ LÝ LỖI (ERROR HANDLING CONVENTIONS)

- **Frontend Error Boundaries**: Bọc các trang quan trọng bằng `DashboardErrorBoundary` để khi có lỗi component con sập, trang web vẫn hiển thị giao diện fallback thân thiện thay vì màn hình trắng.
- **Backend Error Middleware**: Mọi lỗi trong controller được bắt bằng `try...catch` và chuyển đến Error Responder để trả JSON phản hồi đồng nhất.

---

## 8. QUY CHUẨN GHI NHẬT KÝ (LOGGING CONVENTIONS)

- Sử dụng biểu tượng chuẩn để ghi log trên Console giúp phân loại nhanh:
  - 🚀 `[Server]`: Khởi động máy chủ / Socket server.
  - 📊 `[Database]`: Kết nối Mongoose thành công / Migration log.
  - 🚨 `[Error]`: Nhật ký lỗi Exception kèm Stack Trace.
  - ⚠️ `[Warn]`: Cảnh báo tài nguyên / Cảnh báo gian lận.
