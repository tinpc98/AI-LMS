// File: src/shared/middlewares/rbac.middleware.js
// Kiểm tra vai trò dựa trên req.user do verifyUser gắn vào. Hoàn toàn THUẦN — không đọc DB,
// không import model — nên đủ điều kiện nằm ở shared/ mà không vi phạm no-shared-to-modules.
//
// Tách từ auth.middleware.js ở Wave 3.2.

const getRole = (req) => (req.user?.role || "").toLowerCase();

const requireAuthenticated = (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!" });
    return false;
  }
  return true;
};

// Kiểm tra xem có phải Giáo viên hoặc Admin hay không
export const isTeacher = (req, res, next) => {
  if (!requireAuthenticated(req, res)) return;

  const allowedRoles = ["teacher", "admin"];
  if (!allowedRoles.includes(getRole(req))) {
    return res.status(403).json({
      message:
        "Quyền truy cập bị từ chối. Chỉ Giáo viên hoặc Admin mới được phép thực hiện chức năng này",
    });
  }
  next();
};

// Kiểm tra xem có phải Admin hay không
export const isAdmin = (req, res, next) => {
  if (!requireAuthenticated(req, res)) return;

  if (getRole(req) !== "admin") {
    return res.status(403).json({
      message: "Quyền truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền quản lý hệ thống",
    });
  }
  next();
};
