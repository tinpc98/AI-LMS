import { Navigate, Outlet } from "react-router-dom";

interface Props {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const token = localStorage.getItem("accessToken");
  const rawRole = localStorage.getItem("userRole");
  const role = rawRole?.toLowerCase();

  // 1. Nếu không có Access Token hoặc Token hỏng -> Chuyển hướng về /login
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra Role hợp lệ (STUDENT, TEACHER, ADMIN)
  const VALID_ROLES = ["student", "teacher", "admin"];
  if (!role || !VALID_ROLES.includes(role)) {
    // Xóa thông tin độc hại hoặc không hợp lệ khỏi localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  // 3. Admin có toàn quyền truy cập hệ thống (Supervisory Access)
  if (role === "admin") {
    return <Outlet />;
  }

  // 4. Kiểm tra quyền truy cập theo từng Role (Role Guard)
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  if (!normalizedAllowedRoles.includes(role)) {
    // Nếu Học sinh cố tình truy cập Route của Giáo viên / Admin -> Chuyển về trang chủ Học sinh
    if (role === "student") {
      return <Navigate to="/student" replace />;
    }
    // Nếu Giáo viên cố tình truy cập Route của Admin -> Chuyển về trang chủ Giáo viên
    if (role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
