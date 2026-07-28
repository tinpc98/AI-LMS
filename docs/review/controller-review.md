# 🎮 Phân Tích & Đánh Giá Tầng Điều Khiển (Controller Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Tầng Điều Khiển (Controller Overview)](#1-tổng-quan-tầng-điều-khiển-controller-overview)
2. [Hiện Trạng "Fat Controller" & Trộn Lẫn Business Logic](#2-hiện-trạng-fat-controller--trộn-lẫn-business-logic)
3. [Phân Tích Xử Lý HTTP Response & Error Catching](#3-phân-tích-xử-lý-http-response--error-catching)
4. [Đánh Giá Khâu Trích Xuất Input & Validation Trong Controller](#4-đánh-giá-khâu-trích-xuất-input--validation-trong-controller)
5. [Bảng Đánh Giá Chi Tiết 18 Controller Files](#5-bảng-đánh-giá-chi-tiết-18-controller-files)
6. [Khuyến Nghị Chuẩn Hóa Controller Layer](#6-khuyến-nghị-chuẩn-hóa-controller-layer)

---

## 1. Tổng Quan Tầng Điều Khiển (Controller Overview)

Thư mục `Backend/src/controllers/` chứa **18 Controller files**. Nhiệm vụ chính của Controller trong kiến trúc chuẩn là:
1. Nhận Request từ Router.
2. Trích xuất và validate sơ bộ parameters/body/query.
3. Ủy quyền thực thi cho Service Layer.
4. Trả về HTTP Response chuẩn cho Client.

---

## 2. Hiện Trạng "Fat Controller" & Trộn Lẫn Business Logic

### 🔴 Các Controller Vi Phạm Nghiêm Trọng Trách Nhiệm (Fat Controller Pattern):

1. **`class.controller.js` (25.2 KB):**
   - Thay vì gọi `classService`, controller trực tiếp thực hiện:
     - `Class.findById()`
     - Tự tính toán mảng học sinh (`students.push()`)
     - Tự lọc dữ liệu và ánh xạ dữ liệu thống kê tiến độ học tập.
   - Controller phình to hơn 25KB với hàng trăm dòng truy vấn DB trực tiếp.

2. **`assignment.controller.js` (12.6 KB) & `examAttempt.controller.js` (11.7 KB):**
   - Trực tiếp xử lý logic chấm điểm, upload file, và cập nhật trạng thái làm bài ngay trong Controller handler.

```mermaid
graph LR
    subgraph Architecture Chuẩn
        ControllerA[Controller Thon Gọn] --> ServiceA[Service Chứa Logic]
        ServiceA --> ModelA[Model Mongo]
    end
    subgraph Thực Trạng AI-LMS (Fat Controller)
        ControllerB[Fat Controller (25KB)] --> ModelB[Model Mongo Query Trực Tiếp]
        ControllerB -. Bypass .-> ServiceB[Service Rỗng / Anemic]
    end
```

---

## 3. Phân Tích Xử Lý HTTP Response & Error Catching

### ❌ Sự Không Đồng Nhất Trong Response & Error Handler:
- Một số Controller sử dụng khối `try/catch` nhưng trong catch lại viết:
  ```javascript
  return res.status(500).json({ success: false, message: error.message });
  ```
- Việc này triệt tiêu cơ chế Global Error Middleware (`app.use((err, req, res, next) => ...)`), khiến cho việc log lỗi tập trung hoặc đẩy log sang Sentry / Datadog bị vô hiệu hóa hoàn toàn.

---

## 4. Đánh Giá Khâu Trích Xuất Input & Validation Trong Controller

- Nhiều controller thực hiện validate thủ công bằng `if (!id) return res.status(400)...` lặp đi lặp lại thay vì tin tưởng vào `express-validator` middleware ở Router layer.
- Khi trích xuất `req.params.id`, nhiều nơi quên kiểm tra `mongoose.Types.ObjectId.isValid(id)`, dẫn đến Mongoose ném lỗi `CastError` làm crash server thành HTTP status `500` thay vì `400 Bad Request`.

---

## 5. Bảng Đánh Giá Chi Tiết 18 Controller Files

| Controller File Name | Kích thước | Chứa Business Logic? | Trực tiếp Query DB? | Đánh giá |
| :--- | :---: | :---: | :---: | :---: |
| `class.controller.js` | 25.2 KB | 🔴 RẤT NHIỀU | 🔴 CÓ | ❌ Fat Controller |
| `examSet.controller.js` | 19.7 KB | 🟡 Khá | ❌ Không (Gọi Service) | ⚠ Tốt hơn |
| `assignment.controller.js`| 12.6 KB | 🔴 NHIỀU | 🔴 CÓ | ❌ Fat Controller |
| `examAttempt.controller.js`| 11.7 KB | 🔴 NHIỀU | 🔴 CÓ | ❌ Fat Controller |
| `auth.controllers.js` | 8.3 KB | 🟠 Trung bình | 🔴 CÓ | ⚠ Cần tách |
| `dashboard.controller.js` | 0.9 KB | ❌ Không | ❌ Không | ⭐ Thon gọn |

---

## 6. Khuyến Nghị Chuẩn Hóa Controller Layer

1. **Rút toàn bộ Mongoose Query out khỏi `class.controller.js` và `assignment.controller.js` đưa về Service Layer.**
2. Áp dụng wrapper `asyncHandler(fn)` để tự động catch exception và chuyển về `next(error)` cho Global Error Handler xử lý.
3. Ép 100% controllers trả response qua `sendSuccess` helper.
