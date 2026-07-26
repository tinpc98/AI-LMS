// File: src/middlewares/auth.middlewares.js
import jwt from "jsonwebtoken";

// Kiểm tra xem người dùng đã đăng nhập hay chưa
export const verifyUser = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
  }

  try {
    const token = authorization.split(" ")[1]; // Tách chuỗi "Bearer <token>"
    if (!token) {
      return res.status(401).json({ message: "Định dạng token không hợp lệ!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456");

    // Chuẩn hóa đính kèm cả id và _id để tránh mismatch giữa các controllers
    const userId = decoded.id || decoded._id;
    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// Kiểm tra xem có phải Giáo viên hoặc Admin hay không
export const isTeacher = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!" });
  }
  const userRole = (req.user.role || "").toLowerCase();
  const allowedRoles = ["teacher", "admin"];
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: "Quyền truy cập bị từ chối. Chỉ Giáo viên hoặc Admin mới được phép thực hiện chức năng này",
    });
  }
  next();
};

// Kiểm tra xem có phải Admin hay không
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!" });
  }
  const userRole = (req.user.role || "").toLowerCase();
  if (userRole !== "admin") {
    return res.status(403).json({
      message: "Quyền truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền quản lý hệ thống",
    });
  }
  next();
};
