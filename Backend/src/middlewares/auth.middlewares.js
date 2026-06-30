// File: src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

//kiểm tra xem đã đăng nhập chưa
export const verifyUser = (req, res, next) => {
  const { authorization } = req.headers; // Lấy token từ header gửi lên

  if (!authorization) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
  }

  try {
    const token = authorization.split(" ")[1]; // Tách chuỗi "Bearer <token>"
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456"); // Xác thực chìa khóa bí mật

    req.user = decoded; // Đính kèm thông tin user đã giải mã vào req để dùng ở Controller sau này
    next(); // Hợp lệ, cho đi tiếp qua cổng an ninh!
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

//kiểm tra xem có phải giáo viên/admin hay không
export const isTeacher = (req, res, next) => {
  if (!req.user) {
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống, không tìm thấy dữ liệu người dùng" });
  }
  const allowedRoles = ["Teacher", "Admin"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message:
        "Quyền truy cập bị từ chối. Chỉ giáo viên mới có thể thực hiện chức năng này",
    });
  }
  next();
};
