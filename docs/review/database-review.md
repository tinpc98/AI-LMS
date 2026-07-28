# 🗄️ Phân Tích & Đánh Giá Cơ Sở Dữ Liệu & Mongoose (Database Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Thiết Kế Database (Schema Architecture)](#1-tổng-quan-thiết-kế-database-schema-architecture)
2. [Đánh Giá Thiết Kế Schemas & References](#2-đánh-giá-thiết-kế-schemas--references)
3. [Phân Tích Cấu Trúc Index & Hiệu Năng Truy Vấn (Indexing Audit)](#3-phân-tích-cấu-trúc-index--hiệu-năng-truy-vấn-indexing-audit)
4. [Đánh Giá Soft Delete Plugin & Rủi Ro Lọt Dữ Liệu](#4-đánh-giá-soft-delete-plugin--rủi-ro-lọt-dữ-liệu)
5. [Thiếu Hụt Mongoose Transactions (ACID Gaps)](#5-thiếu-hụt-mongoose-transactions-acid-gaps)
6. [Bảng Đánh Giá Chi Tiết 17 Mongoose Models](#6-bảng-đánh-giá-chi-tiết-17-mongoose-models)
7. [Khuyến Nghị Tối Ưu Database Enterprise](#7-khuyến-nghị-tối-ưu-database-enterprise)

---

## 1. Tổng Quan Thiết Kế Database (Schema Architecture)

Hệ thống AI LMS sử dụng **MongoDB** làm cơ sở dữ liệu chính, tương tác thông qua **Mongoose ODM**.  
Tổng số models hiện tại: **17 Models** nằm tại `Backend/src/models/`.

```mermaid
erDiagram
    User ||--o{ Class : teaches
    User ||--o{ Class : enrolled_in
    Class ||--o{ Lesson : contains
    Class ||--o{ Assignment : assigns
    Assignment ||--o{ Submission : submits
    ExamSet ||--o{ Question : contains
    Class ||--o{ Exam : schedules
    Exam ||--o{ ExamAttempt : attempts
```

---

## 2. Đánh Giá Thiết Kế Schemas & References

### ⭐ Điểm Tốt:
- Sử dụng đúng `Schema.Types.ObjectId` cho các trường tham chiếu (`ref: 'User'`, `ref: 'Class'`).
- Tích hợp timestamps (`createdAt`, `updatedAt`) đồng bộ ở hầu hết các Schema.

### ❌ Các Thiếu Sót & Tái Cấu Trúc Schema Cần Thiết:
1. **Model `User` ([user.models.js](file:///e:/AI-LMS/Backend/src/models/user.models.js)):**
   - Trường `isDeleted` được định nghĩa thủ công trong Schema nhưng plugin `softDeletePlugin` cũng tự động thêm `isDeleted`. Việc này gây **xung đột định nghĩa trường** (Duplicate Field Definition).
2. **Model `Class` ([class.model.js](file:///e:/AI-LMS/Backend/src/models/class.model.js)):**
   - Mảng `students: [{ type: Schema.Types.ObjectId, ref: "User" }]` lưu danh sách tất cả học sinh trực tiếp trong document Lớp học.
   - 🔴 **Vấn đề Anti-pattern Unbounded Array:** Nếu một lớp học có 2,000 học sinh, document Class sẽ phình to vượt quá giới hạn BSON 16MB của MongoDB, gây lỗi ghi database và làm chậm các thao tác đọc đơn giản.
3. **Model `ExamSet` ([examSet.model.js](file:///e:/AI-LMS/Backend/src/models/examSet.model.js)):**
   - Lưu trữ mảng lớn `questions` trực tiếp bên trong document ExamSet. Khi ngân hàng đề thi có hàng trăm câu hỏi dạng Rich Text / Hình ảnh, hiệu năng đọc đề thi bị suy giảm nghiêm trọng.

---

## 3. Phân Tích Cấu Trúc Index & Hiệu Năng Truy Vấn (Indexing Audit)

### 🔴 THIẾU INDEX NGHIỆM TRỌNG TRÊN CÁC TRƯỜNG THƯỜNG XUYÊN QUERY:

| Model | Trường Query Thường Xuyên | Trạng Thái Index Hiện Tại | Hậu Quả |
| :--- | :--- | :---: | :--- |
| `Submission` | `assignmentId`, `studentId` | ❌ Thiếu Index Compound | Query danh sách bài nộp phải **COLLSCAN** toàn bộ bảng. |
| `ExamAttempt` | `examId`, `studentId`, `status` | ❌ Thiếu Index | Giảm tốc độ tra cứu kết quả thi khi dữ liệu phình to. |
| `Attendance` | `classId`, `date` | ❌ Thiếu Unique Index | Gây ra điểm danh trùng lặp cùng 1 ngày. |
| `Lesson` | `classId`, `order` | ❌ Thiếu Index | Sắp xếp thứ tự bài học bị chậm. |

---

## 4. Đánh Giá Soft Delete Plugin & Rủi Ro Lọt Dữ Liệu

- `softDeletePlugin.js` tự động bổ sung pre-hook cho `find`, `findOne`, `countDocuments`.
- 🔴 **RỦI RO RÒ RỈ DỮ LIỆU ĐÃ XÓA MỀM TRONG AGGREGATION PIPELINE:**
  - Plugin Mongoose không thể can thiệp tự động vào `Model.aggregate()`.
  - Trong `report.service.js` và `dashboard.service.js`, hàng loạt truy vấn `aggregate([ { $match: { ... } } ])` **không chứa điều kiện `{ isDeleted: false }`**.
  - **Hậu quả:** Báo cáo thống kê doanh số, số lượng bài làm, số lượng học sinh đếm cả những bản ghi đã bị xóa mềm!

---

## 5. Thiếu Hụt Mongoose Transactions (ACID Gaps)

Tất cả các thao tác ghi dữ liệu đa tài nguyên (Multi-document operations) hiện tại **đều chạy không có Transaction**:
- **Tạo bài thi & cập nhật trạng thái lớp:** Nếu tạo bài thi thành công nhưng nộp thông báo thất bại, hệ thống rơi vào trạng thái dữ liệu rác (Inconsistent State).
- **Nộp bài thi `submitExam`:** Cập nhật `ExamAttempt` + Tính lại `Grade` + Gửi Notification chạy rời rạc.

---

## 6. Bảng Đánh Giá Chi Tiết 17 Mongoose Models

| Model Name | Standard Schema? | Has Index? | Has SoftDelete? | Risk Level |
| :--- | :---: | :---: | :---: | :---: |
| `User` | ✔ | ✔ | ✔ | 🟢 Low |
| `Class` | ⚠ Array Unbounded | ❌ Thiếu | ✔ | 🟠 High |
| `Assignment` | ✔ | ❌ Thiếu | ✔ | 🟡 Medium |
| `Submission` | ✔ | ❌ Thiếu | ✔ | 🔴 Critical |
| `ExamAttempt` | ✔ | ❌ Thiếu | ✔ | 🔴 Critical |
| `Attendance` | ⚠ Thiếu Unique | ❌ Thiếu | ✔ | 🟠 High |

---

## 7. Khuyến Nghị Tối Ưu Database Enterprise

1. Bổ sung ngay các Compound Index:
   - `Submission`: `{ assignmentId: 1, studentId: 1 }`
   - `ExamAttempt`: `{ examId: 1, studentId: 1 }`
   - `Attendance`: `{ classId: 1, date: 1, studentId: 1 }` (Unique)
2. Thêm thủ công `$match: { isDeleted: false }` vào tất cả các đoạn pipeline trong `report.service.js`.
3. Chuyển mô hình lưu `students` trong `Class` từ Mảng trực tiếp sang Bảng trung gian `Enrollment`.
