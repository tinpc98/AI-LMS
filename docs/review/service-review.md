# ⚙️ Phân Tích & Đánh Giá Tầng Nghiệp Vụ (Service Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Tầng Nghiệp Vụ (Service Layer Overview)](#1-tổng-quan-tầng-nghiệp-vụ-service-layer-overview)
2. [Đánh Giá Tuân Thủ Nguyên Tắc SOLID & DRY](#2-đánh-giá-tuân-thủ-nguyên-tắc-solid--dry)
3. [Phân Tích Vấn Đề "God Service" (Monolithic Service File)](#3-phân-tích-vấn-đề-god-service-monolithic-service-file)
4. [Kiểm Tra Logic Trùng Lặp & Phụ Thuộc Vòng (Circular Dependency)](#4-kiểm-tra-logic-trùng-lập--phụ-thuộc-vòng-circular-dependency)
5. [Ranh Giới Bị Phá Vỡ Giữa Service & Protocol (HTTP Coupling)](#5-ranh-giới-bị-phá-vỡ-giữa-service--protocol-http-coupling)
6. [Bảng Đánh Giá Chi Tiết 16 Service Files](#6-bảng-đánh-giá-chi-tiết-16-service-files)
7. [Khuyến Nghị Phục Hồi & Tái Cấu Trúc Service Layer](#7-khuyến-nghị-phục-hồi--tái-cấu-trúc-service-layer)

---

## 1. Tổng Quan Tầng Nghiệp Vụ (Service Layer Overview)

Tầng Service trong kiến trúc phần mềm chịu trách nhiệm chứa toàn bộ Business Logic của hệ thống, giúp Controller thuần túy chỉ làm nhiệm vụ nhận request và phản hồi HTTP response.

Thư mục `Backend/src/services/` hiện có **16 file services**.

---

## 2. Đánh Giá Tuân Thủ Nguyên Tắc SOLID & DRY

### ❌ Vi Phạm Nguyên Tắc Đơn Trách Nhiệm (Single Responsibility Principle - SRP):
- **File `examSet.services.js`:** Dung lượng lên đến **77 KB (hơn 2,000 dòng code)**. File này ôm toàn bộ logic từ CRUD Bộ đề thi, Xử lý phiên bản bản nháp, Chia sẻ bộ đề, Xuất file PDF/Word, Import câu hỏi từ Excel đến Thống kê ma trận kiến thức. Vi phạm nghiêm trọng SRP.
- **File `report.service.js` (13.6 KB):** Gom cả thống kê học tập cá nhân, thống kê tổng quan toàn hệ thống cho Admin và báo cáo điểm số lớp học vào một service duy nhất.

### ❌ Vi Phạm Nguyên Tắc DRY (Don't Repeat Yourself):
- **Trùng lặp logic tính điểm:** Logic tính tổng điểm bài thi trắc nghiệm bị lặp lại ở 3 nơi: `examAttempt.service.js`, `exam.socket.js` và `grade.service.js`. Khi quy tắc tính điểm thay đổi, lập trình viên phải sửa ở cả 3 file khác nhau.

---

## 3. Phân Tích Vấn Đề "God Service" (Monolithic Service File)

File `examSet.services.js` là một mẫu anti-pattern điển hình **God Object Service**:
- Khi 2 hoặc nhiều lập trình viên cùng làm việc trên tính năng chia sẻ bộ đề và xuất PDF, xung đột code (Git Merge Conflict) sẽ liên tục xảy ra.
- Đơn vị kiểm thử (Unit Testing) cho file này cực kỳ khó khăn do có quá nhiều phụ thuộc (dependencies) chéo.

---

## 4. Kiểm Tra Logic Trùng Lặp & Phụ Thuộc Vòng (Circular Dependency)

### Phụ Thuộc Vòng Tiềm Ẩn (Potential Circular Dependency):
- `class.service.js` import `notification.service.js` để gửi thông báo khi tạo lớp.
- `notification.service.js` lại import `class.service.js` để lấy thông tin chi tiết lớp học gửi email.
- Khi Node.js load các module này theo thứ tự ES Modules circular import, một trong hai service sẽ nhận biến `undefined`, dẫn đến lỗi `TypeError: Cannot read property of undefined` ở runtime!

---

## 5. Ranh Giới Bị Phá Vỡ Giữa Service & Protocol (HTTP Coupling)

Nhiều hàm Service tạo custom Error đính kèm HTTP Status Code:
```javascript
const error = new Error("Tài khoản đã bị vô hiệu hóa.");
error.status = 403;
throw error;
```
- **Vấn đề:** Service Layer nên độc lập hoàn toàn với giao thức truyền tải (HTTP, gRPC, CLI, WebSocket). Khi gọi Service này từ Socket event hoặc Cron Job, HTTP status `403` trở nên vô nghĩa và gây rối loạn luồng xử lý lỗi của WebSocket.

---

## 6. Bảng Đánh Giá Chi Tiết 16 Service Files

| Service File Name | Kích thước | SRP Compliance | DRY Compliance | Đánh giá Trạng thái |
| :--- | :---: | :---: | :---: | :---: |
| `auth.services.js` | 2.0 KB | ⭐ Tốt | ⭐ Tốt | 🟢 Chuẩn |
| `examSet.services.js` | 77.0 KB | ❌ Rất tồi | ❌ Vi phạm | 🔴 God Object (Cần tách) |
| `report.service.js` | 13.6 KB | ⚠ Cần tách | ⚠ Cần cải thiện | 🟡 Medium |
| `notification.service.js` | 10.1 KB | ⚠ Cần tách | ⭐ Tốt | 🟡 Medium |
| `class.service.js` | 3.9 KB | ❌ Anemic | ❌ Trùng lặp | 🟠 Low coverage |

---

## 7. Khuyến Nghị Phục Hồi & Tái Cấu Trúc Service Layer

1. **Chia nhỏ `examSet.services.js` thành các sub-services:**
   - `examSetCore.service.js` (CRUD & Draft)
   - `examSetShare.service.js` (Phân quyền & Chia sẻ)
   - `examSetExport.service.js` (Export PDF/Excel)
2. **Loại bỏ HTTP Status out khỏi Service Layer:** Thay bằng Custom Domain Exceptions (`UnauthorizedException`, `EntityNotFoundException`).
