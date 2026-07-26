# Kế hoạch Review & Refactor Mã nguồn (Codebase Refactoring Plan)

Tài liệu đánh giá chất lượng mã nguồn, nhận diện Technical Debt và đề xuất kế hoạch tái cấu trúc (Refactoring) cho hệ thống AI-LMS.

---

## 📑 MỤC LỤC
1. [Tổng quan Đánh giá Chất lượng Mã nguồn](#1-tổng-quan-đánh-giá-chất-lượng-mã-nguồn)
2. [Đánh giá Theo Các Tiêu chuẩn Kỹ thuật (Architectural Assessment)](#2-đánh-giá-theo-các-tiêu-chuẩn-kỹ-thuật-architectural-assessment)
   - [2.1 Kiến trúc & Phân tầng (Architecture & Layering)](#21-kiến-trúc--phân-tầng-architecture--layering)
   - [2.2 Tính Dễ đọc & Bảo trì (Readability & Maintainability)](#22-tính-dễ-đọc--bảo-trì-readability--maintainability)
   - [2.3 Khả năng Mở rộng (Scalability)](#23-khả-năng-mở-rộng-scalability)
   - [2.4 Hiệu năng (Performance & N+1 Queries)](#24-hiệu-năng-performance--n1-queries)
   - [2.5 Mã nguồn Trùng lặp (Duplicate Code & DRY)](#25-mã-nguồn-trùng-lặp-duplicate-code--dry)
   - [2.6 Nguyên tắc SOLID & Clean Architecture](#26-nguyên-tắc-solid--clean-architecture)
3. [Bảng Tổng hợp Vấn đề & Giải pháp Refactor (Refactoring Matrix)](#3-bảng-tổng-hợp-vấn-đề--giải-pháp-refactor-refactoring-matrix)

---

## 1. TỔNG QUAN ĐÁNH GIÁ CHẤT LƯỢNG MÃ NGUỒN

Dự án AI-LMS đã đạt được nền tảng kiến trúc vững chắc:
- **Backend**: Áp dụng Enterprise Soft Delete Plugin đồng nhất trên 100% Collections, tách rạch ròi Router -> Controller -> Service -> Model.
- **Frontend**: Triển khai Data Driven Architecture, sử dụng `LearningDashboardContext` làm Single Source of Truth (SSOT), chuyển đổi dữ liệu thông qua Data Mappers.

Tuy nhiên, trong quá trình phát triển nhanh (Rapid Prototyping), mã nguồn còn tồn tại một số khu vực xuất hiện mã trùng lặp, xử lý bất đồng bộ tuần tự chưa tối ưu performance và các hàm Controller có kích thước lớn cần tái cấu trúc.

---

## 2. ĐÁNH GIÁ THEO CÁC TIÊU CHUẨN KỸ THUẬT (ARCHITECTURAL ASSESSMENT)

### 2.1 Kiến trúc & Phân tầng (Architecture & Layering)
- **Điểm mạnh**: Đã phân tách rạch ròi giữa Controller tiếp nhận HTTP Request và Service xử lý Business Logic.
- **Điểm cần cải thiện**: Một số Controller (như `assignment.controller.js` và `class.controller.js`) vẫn chứa một phần logic xử lý file đính kèm với Cloudinary trực tiếp thay vì đẩy vào Service layer.

### 2.2 Tính Dễ đọc & Bảo trì (Readability & Maintainability)
- **Điểm mạnh**: Đặt tên biến và hàm theo chuẩn English camelCase rõ nghĩa (`fetchDashboardData`, `calculateLearningScore`).
- **Điểm cần cải thiện**: File `assignment.controller.js` có độ dài hơn 350 dòng chứa cả logic cho Giáo viên và Học sinh, nên tách thành 2 file riêng biệt: `teacherAssignment.controller.js` và `studentAssignment.controller.js`.

### 2.3 Khả năng Mở rộng (Scalability)
- **Điểm mạnh**: Mongoose Schema phân chia linh hoạt, dễ dàng bổ sung các trường thuộc tính mới.
- **Điểm cần cải thiện**: Chuyển đổi các câu lệnh query lặp lại nhiều lần thành Mongoose Static Methods hoặc Repository Pattern.

### 2.4 Hiệu năng (Performance & N+1 Queries)
- **Điểm mạnh**: Sử dụng `Promise.all` khi truy vấn dữ liệu song song ở `learningDashboard.service.ts`.
- **Điểm cần cải thiện**: Trong `learningDashboard.service.ts`, câu lệnh lấy bài tập và đề thi đang lặp qua từng lớp học (`topClasses.map(...)`). Cần tối ưu thành 1 câu lệnh `Assignment.find({ classId: { $in: classIds } })` duy nhất để tránh truy vấn cơ sở dữ liệu theo dạng N+1.

### 2.5 Mã nguồn Trùng lặp (Duplicate Code & DRY)
- **Điểm mạnh**: Đã đóng gói thành công `softDeletePlugin` dùng chung cho toàn bộ 13 Models.
- **Điểm cần cải thiện**: Logic chuẩn hóa tên người dùng, định dạng thời gian và bọc try-catch response đang lặp lại ở một số Controllers.

---

## 3. BẢNG TỔNG HỢP VẤN ĐỀ & GIẢI PHÁP REFACTOR (REFACTORING MATRIX)

| STT | Vấn đề Kiến trúc / Code Smell | Nguyên nhân Root Cause | Giải pháp Refactor Đề xuất | Độ ưu tiên | Độ khó |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | Truy vấn lặp N+1 khi lấy Bài tập & Đề thi của Lớp học | Dùng `Promise.all` kết hợp `map()` lặp qua danh sách lớp từng cái một | Thay bằng `$in` operator: `Assignment.find({ classId: { $in: classIds } })` | `High` | `Easy` |
| **2** | Class Controller & Assignment Controller có dung lượng lớn (>350 dòng) | Chứa chung cả API nghiệp vụ dành cho Giáo viên, Học sinh và Admin | Tách thành các Controller nhỏ theo Domain: `studentAssignment.controller.js`, `teacherAssignment.controller.js` | `Medium` | `Medium` |
| **3** | Xử lý Cloudinary Upload phân tán ở nhiều Controllers | Gọi trực tiếp `cloudinary.uploader.destroy` tại Controller | Đóng gói thành `cloudinary.service.js` dùng chung toàn bộ hệ thống | `Medium` | `Easy` |
| **4** | Frontend Toast Notification gọi phân tán | Import `toast` từ utils ở nhiều trang khác nhau | Chuẩn hóa thông qua Custom Hook `useNotificationToast` | `Low` | `Easy` |
| **5** | Thiếu Repository Layer đóng gói Mongoose Queries | Controller/Service gọi trực tiếp `Model.find()`, `Model.aggregate()` | Xây dựng Repository Pattern cho các Model phức tạp (`ClassRepository`, `ExamRepository`) | `Low` | `Hard` |
