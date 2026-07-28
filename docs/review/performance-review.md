# ⚡ Phân Tích & Đánh Giá Hiệu Năng & Tối Ưu (Performance Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Đánh Giá Hiệu Năng (Performance Assessment Overview)](#1-tổng-quan-đánh-giá-hiệu-năng-performance-assessment-overview)
2. [Hiểm Họa Về N+1 Query Trong Mongoose (N+1 Query Hazards)](#2-hiểm-họa-về-n1-query-trong-mongoose-n1-query-hazards)
3. [Phân Tích Sử Dụng `.populate()`, `.lean()` & Projection](#3-phân-tích-sử-dụng-populate-lean--projection)
4. [Tối Ưu Hóa Bất Đồng Bộ (Async / Await vs Promise.all)](#4-tối-ưu-hóa-bất-đồng-bộ-async--await-vs-promiseall)
5. [Aggregation Pipeline & Caching Gaps](#5-aggregation-pipeline--caching-gaps)
6. [Bảng Điểm Hiệu Năng Chi Tiết Theo Phân Hệ](#6-bảng-điểm-hiệu-năng-chi-tiết-theo-phân-hệ)
7. [Khuyến Nghị Tối Ưu Hiệu Năng Tối Đa (Max Performance Roadmap)](#7-khuyến-nghị-tối-ưu-hiệu-năng-tối-đa-max-performance-roadmap)

---

## 1. Tổng Quan Đánh Giá Hiệu Năng (Performance Assessment Overview)

Khi hệ thống AI LMS mở rộng quy mô (Scale up) với hàng ngàn học sinh cùng truy cập làm bài thi trực tuyến hoặc xem tiến độ học tập, hiệu năng Backend phụ thuộc 80% vào chiến lược truy vấn cơ sở dữ liệu MongoDB và cơ chế quản lý bất đồng bộ trong Node.js.

Qua audit toàn bộ source code, bộ phận kỹ thuật phát hiện nhiều điểm nghẽn cổ chai (Bottlenecks) nghiêm trọng liên quan tới **Vòng lặp N+1 Query**, **Thiếu `.lean()`**, **Lấy thừa dữ liệu (Over-fetching)** và **Lạm dụng `.populate()` đa tầng**.

---

## 2. Hiểm Họa Về N+1 Query Trong Mongoose (N+1 Query Hazards)

### 🔴 VÍ DỤ CỤ THỂ TRONG CODEBASE (`class.controller.js` & `report.service.js`):

```javascript
// Mã nguồn hiện tại trong class.controller.js (Lấy danh sách tiến độ học sinh)
const classData = await Class.findById(classId);
const studentProgress = [];

for (const studentId of classData.students) {
  // 🔴 N+1 QUERY HAZARD: Thực hiện 1 query DB cho MỖI HỌC SINH trong vòng lặp!
  const submissions = await Submission.find({ studentId, classId });
  const examAttempts = await ExamAttempt.find({ studentId, classId });
  studentProgress.push({ studentId, submissions, examAttempts });
}
```

- **Hậu quả:** Nếu lớp học có **100 học sinh**, để trả về tiến độ lớp, Backend phải thực hiện **1 + (100 * 2) = 201 chuyến khứ hồi (Round-trips)** tới Database MongoDB! Trễ mạng (Latency) bị nhân lên 200 lần, gây treo HTTP Connection và sập server khi có nhiều giáo viên cùng mở dashboard.

---

## 3. Phân Tích Sử Dụng `.populate()`, `.lean()` & Projection

### ❌ 1. Quên Sử Dụng `.lean()` Cho Các Read-only Queries:
- Khi dùng `Model.find()`, Mongoose tự động bọc từng kết quả thành một **Mongoose Document Hydrated Object** đầy đủ các phương thức `save()`, `validate()`, internal getters/setters.
- Trong `class.controller.js`, `course.controller.js` và `examSet.services.js`, hàng loạt câu lệnh `find()` **không hề dùng `.lean()`**.
- **Hậu quả:** Tiêu tốn bộ nhớ RAM gấp 3-5 lần và tăng thời gian CPU garbage collection khi parse JSON response lớn.

### ❌ 2. Over-fetching (Thiếu Select / Projection):
- Truy vấn `User.findById(userId)` hoặc `Class.find()` nhiều nơi không chọn lọc các field cần thiết (`.select("fullName avatar")`), mà lấy toàn bộ document bao gồm cả các metadata phức tạp không dùng đến.

### ❌ 3. Deep Nested `.populate()`:
- Trong `examSet.services.js`, gọi populate 3 tầng: `populate({ path: 'questions', populate: { path: 'author' } })`. Việc này buộc Mongoose thực hiện nhiều query nối tiếp ngầm bên dưới, hủy hoại hoàn toàn tốc độ truy vấn của MongoDB.

---

## 4. Tối Ưu Hóa Bất Đồng Bộ (Async / Await vs Promise.all)

### ⭐ Điểm Tốt:
- Trong `auth.controllers.js:getAllUsers`, đã biết sử dụng `Promise.all([User.find(), User.countDocuments()])` để chạy song song 2 query.

### ❌ Điểm Chưa Tốt:
- Trong `dashboard.service.js` và `report.service.js`, các câu lệnh `await` được xếp tuần tự (sequential awaiting) cho các tác vụ hoàn toàn độc lập:
  ```javascript
  const totalClasses = await Class.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'Student' });
  const totalExams = await Exam.countDocuments();
  ```
- **Tối ưu:** Cần bọc thành `Promise.all([Class.countDocuments(), User.countDocuments(...), Exam.countDocuments()])` để giảm thời gian phản hồi từ `T1 + T2 + T3` xuống `Max(T1, T2, T3)`.

---

## 5. Aggregation Pipeline & Caching Gaps

- Hệ thống **chưa tích hợp Redis Cache** cho các dữ liệu ít biến động như: Danh mục khóa học (`Course`), Ngân hàng câu hỏi mẫu, hoặc Thông tin cấu hình hệ thống.
- Các đường dẫn API Dashboard và Report liên tục chạy lại các đường ống Aggregation Pipeline nặng nề trực tiếp trên MongoDB Primary Node.

---

## 6. Bảng Điểm Hiệu Năng Chi Tiết Theo Phân Hệ

| Phân hệ | Mức độ N+1 Risk | Tỷ lệ sử dụng `.lean()` | Tối ưu Async/Await | Điểm Hiệu Năng |
| :--- | :---: | :---: | :---: | :---: |
| **Auth / User** | 🟢 Thấp | 50% | ⭐ Tốt | 7.5/10 |
| **Class / Lesson** | 🔴 CỰC CAO | 10% | ❌ Tuần tự | 4.0/10 |
| **ExamSet / Exam** | 🟠 Trung bình | 30% | ⚠ Trung bình | 5.5/10 |
| **Report / Dashboard**| 🔴 CAO | 0% | ❌ Tuần tự | 3.5/10 |

---

## 7. Khuyến Nghị Tối Ưu Hiệu Năng Tối Đa (Max Performance Roadmap)

1. **Xóa bỏ hoàn toàn các vòng lặp `for...await`:** Thay bằng single query với `$in` operator hoặc Aggregation `$lookup`.
2. Bắt buộc thêm `.lean()` vào 100% các câu lệnh `find()` và `findOne()` chỉ dùng cho mục đích Đọc (Read-only).
3. Đưa Redis Cache vào các API Dashboard và Danh mục Khóa học với TTL 5-15 phút.
