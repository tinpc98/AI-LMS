# 🧹 Phân Tích & Đánh Giá Chất Lượng Mã Nguồn (Clean Code Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS Backend)  
**Tác giả audit:** Principal Backend Architect & Technical Auditor  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Chất Lượng Mã Nguồn (Clean Code Overview)](#1-tổng-quan-chất-lượng-mã-nguồn-clean-code-overview)
2. [Phát Hiện Code Smells & Magic Values](#2-phát-hiện-code-smells--magic-values)
3. [Đánh Giá Độ Phức Tạp Rẽ Nhánh (Cyclomatic Complexity & Deep Nesting)](#3-đánh-giá-độ-phức-tạp-rẽ-nhánh-cyclomatic-complexity--deep-nesting)
4. [Mã Nguồn Chết & Khai Báo Không Sử Dụng (Dead Code & Unused Imports)](#4-mã-nguồn-chết--khai-báo-không-sử-dụng-dead-code--unused-imports)
5. [Đánh Giá Tuân Thủ KISS, YAGNI, DRY & SOLID](#5-đánh-giá-tuân-thủ-kiss-yagni-dry--solid)
6. [Bảng Tổng Hợp Chỉ Số Clean Code Theo Module](#6-bảng-tổng-hợp-chỉ-số-clean-code-theo-module)
7. [Khuyến Nghị Refactoring Chuẩn Clean Code](#7-khuyến-nghị-refactoring-chuẩn-clean-code)

---

## 1. Tổng Quan Chất Lượng Mã Nguồn (Clean Code Overview)

Mã nguồn sạch (Clean Code) giúp hệ thống dễ đọc, dễ bảo trì, dễ mở rộng và giảm thiểu tối đa các lỗi ngầm ở tương lai. Qua quá trình scan tĩnh (Static Code Analysis) toàn bộ thư mục `Backend/src`, hệ thống bộc lộ khá nhiều Code Smells về **Magic Numbers/Strings**, **Deep Nested IF/TRY**, **Dead Code** và **File kích thước quá khổ**.

---

## 2. Phát Hiện Code Smells & Magic Values

### ❌ 1. Magic Strings Rải Rác:
- Chuỗi Vai trò (`"Admin"`, `"Teacher"`, `"Student"`) và Trạng thái (`"Active"`, `"Inactive"`, `"Locked"`) được viết trực tiếp dạng string literal trong hàng chục controller/service thay vì dùng `ENUM` hằng số tập trung:
  ```javascript
  if (user.role === "Teacher" || user.role === "admin") // Viết lúc chữ hoa, chữ thường!
  ```
- Việc so sánh string literal không qua Enum dẫn đến lỗi chính tả tiềm ẩn (ví dụ `"teacher"` vs `"Teacher"`) làm sai lệch logic phân quyền.

### ❌ 2. Magic Numbers:
- Thời gian hết hạn JWT `"1d"`, `"15m"`, độ dài băm mật khẩu `10`, giới hạn phân trang `10`, `100` được hardcode trực tiếp trong mã nguồn mà không khai báo biến hằng số (Constants).

---

## 3. Đánh Giá Độ Phức Tạp Rẽ Nhánh (Cyclomatic Complexity & Deep Nesting)

### 🔴 Deeply Nested IF & TRY trong `examSet.services.js` & `class.controller.js`:
- Nhiều hàm có độ lồng nhau lên đến **5-6 tầng `if/else`**:
  ```javascript
  if (examSet) {
    if (examSet.ownerId === userId) {
      if (status === 'PUBLISHED') {
        try {
          if (questions && questions.length > 0) {
            // ... Logic nằm ở tầng lồng thứ 6!
          }
        } catch (e) {}
      }
    }
  }
  ```
- **Hậu quả:** Cực kỳ khó đọc và theo dõi luồng thực thi (Cognitive Overload). Cần áp dụng kỹ thuật **Guard Clauses (Early Return)** để làm phẳng code.

---

## 4. Mã Nguồn Chết & Khai Báo Không Sử Dụng (Dead Code & Unused Imports)

- File `reconstruct.js` và `note.txt`, `tailieu.txt` nằm trực tiếp trong gốc thư mục `Backend/` chứa các đoạn script thử nghiệm rác chưa dọn dẹp.
- Nhiều file Controller import `mongoose` hoặc các service nhưng không hề sử dụng trong bất kỳ handler nào.

---

## 5. Đánh Giá Tuân Thủ KISS, YAGNI, DRY & SOLID

- **KISS (Keep It Simple, Stupid):** ❌ Vi phạm tại `examSet.services.js`. Logic xử lý bản nháp (Drafting) quá rườm rà.
- **YAGNI (You Aren't Gonna Need It):** ⚠ Khai báo một số Schema field trong `user.models.js` (`availabilityScheduleSchema`) khá phức tạp nhưng chưa có API sử dụng triệt để.
- **DRY (Don't Repeat Yourself):** ❌ Vi phạm lặp lại logic validation và format response ở khắp các file.

---

## 6. Bảng Tổng Hợp Chỉ Số Clean Code Theo Module

| Module Name | Magic Values? | Deep Nesting? | Guard Clause Used? | Rating |
| :--- | :---: | :---: | :---: | :---: |
| `auth` | ⚠ Một số | 🟢 Ít | ✔ Có | 7.0/10 |
| `class` | 🔴 Trùng lặp | 🔴 Sâu (5-6) | ❌ Không | 4.0/10 |
| `examSet` | 🔴 Nhiều Magic String | 🔴 Sâu (6+) | ❌ Không | 3.5/10 |
| `attendance` | 🟢 Ít | 🟢 Phẳng | ✔ Có | 8.0/10 |

---

## 7. Khuyến Nghị Refactoring Chuẩn Clean Code

1. Tạo file `src/constants/roles.js` và `src/constants/status.js` để định nghĩa Enum tập trung cho toàn ứng dụng.
2. Áp dụng Guard Clause (Return sớm) loại bỏ toàn bộ các khối `if/else` lồng sâu quá 3 tầng.
3. Dọn dẹp các file script rác (`reconstruct.js`, `note.txt`) khỏi thư mục Backend.
