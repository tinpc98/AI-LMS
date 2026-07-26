import { Navigate, Outlet } from "react-router-dom";

export default function PublicRoute() {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("userRole")?.toLowerCase();

  // Nếu người dùng đã đăng nhập và có Token + Role hợp lệ
  if (token && role) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    if (role === "student") {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
