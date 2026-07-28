# 🛡️ Phân Tích & Đánh Giá Middleware Xác Thực (Auth Middleware Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Các Middlewares Xác Thực](#1-tổng-quan-các-middlewares-xác-thực)
2. [Rà Soát Chi Tiết Middleware `verifyUser`](#2-rà-soát-chi-tiết-middleware-verifyuser)
3. [Rà Soát Chi Tiết Middlewares Phân Quyền `isTeacher` & `isAdmin`](#3-rà-soát-chi-tiết-middlewares-phân-quyền-isteacher--isadmin)
4. [Bảng Đánh Giá Xử Lý Mã Lỗi HTTP (Status Code Mapping Matrix)](#4-bảng-đánh-giá-xử-lý-mã-lỗi-http-status-code-mapping-matrix)
5. [Tóm Tắt Các Cải Tiến Đã Thực Thi](#5-tóm-tắt-các-cải-tiến-đã-thực-thi)

---

## 1. Tổng Quan Các Middlewares Xác Thực

File chính xử lý Middleware xác thực là [auth.middlewares.js](file:///e:/AI-LMS/Backend/src/middlewares/auth.middlewares.js).  
Hệ thống cung cấp 3 middleware chính:
1. `verifyUser`: Chốt chặn xác thực người dùng đã đăng nhập và có Token hợp lệ.
2. `isTeacher`: Chốt chặn phân quyền cho Giáo viên hoặc Admin.
3. `isAdmin`: Chốt chặn phân quyền tuyệt đối cho Quản trị viên.

---

## 2. Rà Soát Chi Tiết Middleware `verifyUser`

### 🔍 Luồng Xử Lý Hiện Tại Trong Source Code:

```javascript
export const verifyUser = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
  }

  try {
    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Định dạng token không hợp lệ!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456");
    const userId = decoded.id || decoded._id;

    // ✨ ĐÃ BỔ SUNG: Kiểm tra dữ liệu sống từ Database MongoDB
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Tài khoản của bạn không tồn tại hoặc đã bị vô hiệu hóa!" });
    }
    if (user.status === "Inactive" || user.status === "Locked") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!" });
    }

    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};
```

### ⭐ Điểm Mạnh Sau Khi Được Cải Tiến:
- ✅ **Parse Bearer Token an toàn:** Kiểm tra đầy đủ sự tồn tại của header `authorization` và tách chuỗi `"Bearer <token>"`.
- ✅ **Chuẩn hóa ID:** Đính kèm cả `req.user.id` và `req.user._id` tránh lỗi mismatch.
- ✅ **Chống Soft Delete & Account Lock Bypass:** Kiểm tra trực tiếp DB ở mọi request.
- ✅ **Không biến lỗi JWT thành HTTP 500:** Ngoại lệ từ `jwt.verify` rơi vào catch và trả về HTTP 401 Unauthorized chuẩn xác.

---

## 3. Rà Soát Chi Tiết Middlewares Phân Quyền `isTeacher` & `isAdmin`

- `isTeacher`: So sánh `(req.user.role || "").toLowerCase()` với mảng `["teacher", "admin"]`. Cho phép cả Admin và Teacher truy cập các chức năng giảng dạy.
- `isAdmin`: So sánh `(req.user.role || "").toLowerCase() === "admin"`. Chặn toàn bộ Học sinh và Giáo viên.

---

## 4. Bảng Đánh Giá Xử Lý Mã Lỗi HTTP (Status Code Mapping Matrix)

| Tình Huống Kỹ Thuật | HTTP Status Code | Message Trả Về | Đánh Giá |
| :--- | :---: | :--- | :---: |
| **Thiếu Authorization Header** | **401 Unauthorized** | `"Bạn chưa đăng nhập hệ thống!"` | ⭐ Đúng chuẩn |
| **Format Token sai (Malformed)** | **401 Unauthorized** | `"Định dạng token không hợp lệ!"` | ⭐ Đúng chuẩn |
| **Token hết hạn / Chữ ký sai** | **401 Unauthorized** | `"Token không hợp lệ hoặc đã hết hạn!"` | ⭐ Đúng chuẩn |
| **User bị Soft Delete (`isDeleted`)** | **401 Unauthorized** | `"Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!"` | ⭐ Đúng chuẩn |
| **User bị Khóa (`status: Locked`)** | **403 Forbidden** | `"Tài khoản của bạn đã bị khóa..."` | ⭐ Đúng chuẩn |
| **Học sinh gọi API Giáo viên** | **403 Forbidden** | `"Quyền truy cập bị từ chối..."` | ⭐ Đúng chuẩn |

---

## 5. Tóm Tắt Các Cải Tiến Đã Thực Thi

- Đã chuyển `verifyUser` sang dạng `async/await` để thực hiện truy vấn DB xác minh trạng thái tài khoản thời gian thực.
