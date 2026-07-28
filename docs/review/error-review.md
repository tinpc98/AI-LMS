# 🚨 Phân Tích & Đánh Giá Xử Lý Lỗi Tập Trung (Error Handling Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Cơ Chế Xử Lý Lỗi (Error Handling Overview)](#1-tổng-quan-cơ-chế-xử-lý-lỗi-error-handling-overview)
2. [Đánh Giá Khối Try/Catch Trong Controllers & Async Handlers](#2-đánh-giá-khối-trycatch-trong-controllers--async-handlers)
3. [Phân Tích Global Error Handling Middleware](#3-phân-tích-global-error-handling-middleware)
4. [Hiểm Họa Về Unhandled Promise Rejections & Process Crash](#4-hiểm-họa-về-unhandled-promise-rejections--process-crash)
5. [Đánh Giá Hệ Thống Logging & Traceability](#5-đánh-giá-hệ-thống-logging--traceability)
6. [Bảng Đánh Giá Xử Lý Lỗi Chi Tiết Theo Module](#6-bảng-đánh-giá-xử-lý-lỗi-chi-tiết-theo-module)
7. [Khuyến Nghị Xây Dựng Kiến Trúc Xử Lý Lỗi Chuẩn Enterprise](#7-khuyến-nghị-xây-dựng-kiến-trúc-xử-lý-lỗi-chuẩn-enterprise)

---

## 1. Tổng Quan Cơ Chế Xử Lý Lỗi (Error Handling Overview)

Một cơ chế xử lý lỗi đạt chuẩn Production phải đảm bảo 3 tiêu chí:
1. **Không làm crash ứng dụng Node.js** khi xảy ra ngoại lệ không lường trước (Unhandled Exception/Rejection).
2. **Không nuốt lỗi (Error Swallowing)** hoặc trả về thông tin sai lệch cho Client.
3. **Log lỗi chi tiết** đính kèm Stack Trace và Context để lập trình viên nhanh chóng khoanh vùng vị trí hỏng hóc.

---

## 2. Đánh Giá Khối Try/Catch Trong Controllers & Async Handlers

### ❌ 1. Nuốt Lỗi & Trả Về Thông Báo Chung Chung (Error Masking):
Trong nhiều controller (như `attendance.controller.js`, `grade.controller.js`), khối catch viết như sau:
```javascript
} catch (error) {
  return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
}
```
- **Vấn đề:** Không ghi log lỗi (`console.error` hoặc Logger) ra màn hình console hay file log. Khi xảy ra lỗi DB hay null pointer, lập trình viên hoàn toàn mù tịt không biết nguyên nhân tại sao lỗi xảy ra!

### ❌ 2. Thiếu Middleware Async Handler Wrapper:
- Toàn bộ 18 controller đều tự bọc khối `try/catch` thủ công. Việc này dẫn đến hàng trăm dòng code lặp đi lặp lại chỉ làm nhiệm vụ bắt lỗi.
- Chuẩn Express khuyến nghị dùng `express-async-handler` hoặc wrapper function để tự động bắt rejection của `async/await` và đẩy về `next(error)`.

---

## 3. Phân Tích Global Error Handling Middleware

Tại file [main.js:L117-123](file:///e:/AI-LMS/Backend/main.js#L117-L123):
```javascript
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi hệ thống:", err.stack);
  res.status(500).json({
    message: err.message || "Đã xảy ra lỗi nội bộ trên Server!",
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});
```

### ⚠ Đánh Giá Kỹ Thuật:
- ⭐ **Tốt:** Đã khai báo đủ 4 tham số `(err, req, res, next)` đúng chuẩn Error Middleware của Express.
- ❌ **Chưa tốt:** Không phân loại loại lỗi (Mongoose `ValidationError`, `CastError`, `MongoServerError 11000` Duplicate Key, `JsonWebTokenError`). Mọi lỗi bất kể là validate hay syntax đều bị coi là lỗi `500 Server Error` nếu ném về đây.

---

## 4. Hiểm Họa Về Unhandled Promise Rejections & Process Crash

Trong `main.js`, **hoàn toàn thiếu** 2 event listener quan trọng cấp độ Node.js Process:
```javascript
process.on("unhandledRejection", (reason, promise) => { ... });
process.on("uncaughtException", (error) => { ... });
```
- **Hậu quả:** Nếu một socket event hoặc một hàm bất đồng bộ trong Cron Job ném ra unhandled rejection, toàn bộ tiến trình Node.js Server sẽ bị crash ngay lập tức (`ERR_UNHANDLED_REJECTION`), khiến tất cả người dùng đang kết nối bị ngắt liên lạc!

---

## 5. Đánh Giá Hệ Thống Logging & Traceability

- ❌ Hệ thống chỉ sử dụng `console.log()` và `console.error()` rải rác.
- ❌ Không sử dụng thư viện Logging chuyên nghiệp như `Winston` hoặc `Pino`.
- ❌ Không có Correlation ID (Request ID) đính kèm trong từng log, khiến cho việc trace một luồng request qua nhiều middleware/service trở nên vô cùng khó khăn.

---

## 6. Bảng Đánh Giá Xử Lý Lỗi Chi Tiết Theo Module

| Module | Try/Catch Coverage | Console Log Error? | Has Custom Status? | Risk Level |
| :--- | :---: | :---: | :---: | :---: |
| `auth.controllers.js` | 100% | ✔ Có | ✔ Có | 🟢 Good |
| `class.controller.js` | 90% | ❌ Nuốt lỗi | ❌ Mặc định 500 | 🟠 High Risk |
| `examSet.controller.js`| 95% | ✔ Có | ✔ Có | 🟡 Medium |
| `cron.setup.js` | 50% | ❌ Thiếu catch | N/A | 🔴 Critical Risk |

---

## 7. Khuyến Nghị Xây Dựng Kiến Trúc Xử Lý Lỗi Chuẩn Enterprise

1. Đưa ngay `process.on("unhandledRejection")` và `process.on("uncaughtException")` vào `main.js`.
2. Tạo class `AppError extends Error` để định nghĩa rõ `statusCode`, `errorCode` và `isOperational`.
3. Bổ sung Winston Logger ghi log lỗi ra file `logs/error.log` phân chia theo ngày.
