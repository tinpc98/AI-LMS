// File: src/modules/auth/auth.middleware.js
// Xác thực JWT + kiểm tra trạng thái tài khoản thực tế trong DB.
//
// Vì sao nằm ở modules/auth chứ không phải shared/ như §2.1 của kế hoạch đề xuất:
// middleware này BẮT BUỘC phải đọc model User. Nếu để ở shared/ thì shared sẽ phụ thuộc
// vào một module nghiệp vụ, vi phạm rule no-shared-to-modules (§5.2) — hai mục này của
// kế hoạch mâu thuẫn nhau. Đặt ở đây thì phụ thuộc User trở thành nội bộ module, và các
// module khác dùng verifyUser qua public API #modules/auth, đúng chiều phụ thuộc.
//
// Phần kiểm tra vai trò thuần tuý (isTeacher/isAdmin) không đọc DB nên đã tách sang
// #shared/middlewares/rbac.middleware.js.
import jwt from "jsonwebtoken";
import User from "./user.model.js";

export const verifyUser = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
  }

  try {
    const token = authorization.split(" ")[1]; // Tách chuỗi "Bearer <token>"
    if (!token) {
      return res.status(401).json({ message: "Định dạng token không hợp lệ!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chuẩn hóa đính kèm cả id và _id để tránh mismatch giữa các controllers
    const userId = decoded.id || decoded._id;

    // Kiểm tra trạng thái tài khoản thực tế từ DB (Xử lý Soft Delete và Lock)
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res
        .status(401)
        .json({ message: "Tài khoản của bạn không tồn tại hoặc đã bị vô hiệu hóa!" });
    }

    if (user.status === "Inactive" || user.status === "Locked") {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!" });
    }

    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
      role: user.role, // Lấy role mới nhất từ DB
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};
