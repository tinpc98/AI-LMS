# 01 - Xác thực & Người dùng (Auth & Users)

**Ngày review:** 2026-08-18
**Trạng thái tổng thể:** 🟢 Ổn định

## 1. Tóm tắt

Module Quản lý Người dùng và Xác thực đóng vai trò nền tảng. Hỗ trợ 3 role (Admin, Teacher, Student) với cơ chế đăng nhập bằng Email/Password, lưu trữ JWT Token. Tích hợp schema chuyên biệt cho Teacher (giờ rảnh, môn dạy). Hiện tại các tính năng OAuth và Quên mật khẩu chưa được triển khai ở Frontend.

## 2. Mức độ hoàn thiện

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Model & Schema | ✅ Hoàn thành | `user.model.js` đầy đủ, tự động hash mật khẩu `pre("save")`, có soft delete. |
| REST API | ✅ Hoàn thành | Đầy đủ API đăng nhập, lấy/cập nhật hồ sơ, và bộ CRUD cho Admin (kể cả thùng rác). |
| Phân quyền | ✅ Hoàn thành | Các route quản trị đều bọc middleware `isAdmin`. |
| Validation | ✅ Hoàn thành | Kiểm tra format ObjectId, kiểm tra Email unique. |
| Frontend - All Roles | ✅ Hoàn thành | `LoginPage.tsx` có UI đẹp, responsive, lưu token vào `localStorage`, điều hướng mượt. |
| Realtime (nếu có) | ➖ Không áp dụng | |
| Xử lý lỗi | ✅ Hoàn thành | Bắt lỗi 400, 401, 404 chuẩn chỉ. FE dùng `getApiErrorMessage` để toast lỗi. |

Trạng thái: ✅ Hoàn thành · ⚠️ Một phần · ❌ Thiếu · ➖ Không áp dụng

## 3. Danh sách API

| Method | Path | Middleware | Vai trò | Trạng thái |
|---|---|---|---|---|
| POST | `/api/auth/login` | (Không) | Đăng nhập lấy token | 🟢 Hoạt động |
| GET | `/api/auth/me` | `verifyUser` | Lấy profile hiện tại | 🟢 Hoạt động |
| PUT | `/api/auth/me` | `verifyUser` | Cập nhật profile | 🟢 Hoạt động |
| GET | `/api/users` | `verifyUser`, `isAdmin` | (Admin) Lấy ds users | 🟢 Hoạt động |
| POST | `/api/users` | `verifyUser`, `isAdmin` | (Admin) Tạo user | 🟢 Hoạt động |
| GET | `/api/users/trash`| `verifyUser`, `isAdmin` | (Admin) DS thùng rác | 🟢 Hoạt động |
| PATCH | `/api/users/:id/restore` | `verifyUser`, `isAdmin` | (Admin) Khôi phục user| 🟢 Hoạt động |

## 4. Lỗi phát hiện

Không có lỗi nghiêm trọng nào được phát hiện trong logic lõi.

### [🔵 Thấp] Nút chức năng đang bị vô hiệu hóa
- **Mô tả:** Trên `LoginPage.tsx`, nút "Quên mật khẩu", Đăng nhập Google, Facebook đang bị `disabled` cứng và ghi chú "Tính năng đang được phát triển".
- **Vị trí:** `Frontend/src/features/auth/pages/LoginPage.tsx`
- **Ảnh hưởng:** Người dùng không thể tự lấy lại mật khẩu.
- **Đề xuất:** Ẩn tạm thời các nút này hoặc tiến hành tích hợp OAuth2 và hệ thống gửi Email (Nodemailer).

## 5. Kiểm thử đã thực hiện

| # | Kịch bản | Kỳ vọng | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Bóc tách response login | Không bị lỗi R1 | Lấy đúng `res.data.data` và `accessToken` | Chưa kiểm chứng |
| 2 | Điều hướng sau login | Chạy đúng route theo Role | Chuyển `/admin`, `/teacher`, `/student` chuẩn xác | Chưa kiểm chứng |
| 3 | Bảo mật mật khẩu | Trả về FE không chứa hash | Có `delete ret.password` trong schema transform | Chưa kiểm chứng |

## 6. Nợ kỹ thuật

- Frontend hiện tại lưu thẳng `accessToken` vào `localStorage`, chưa có cơ chế Refresh Token (hoặc cookie `httpOnly` cho an toàn hơn).
- Giao diện Register (Đăng ký) không có, nghĩa là người dùng chỉ có thể được thêm vào hệ thống bởi Admin.

## 7. Việc cần làm

| # | Việc | Mức độ | Ước lượng | FE/BE |
|---|---|---|---|---|
| 1 | Xây dựng chức năng Quên mật khẩu qua Email | 🟡 Trung bình | 8h | Cả hai |
| 2 | Tích hợp Đăng nhập bằng Google | 🟡 Trung bình | 6h | Cả hai |
