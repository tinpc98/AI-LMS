import { Navigate } from "react-router-dom";

export default function RoleRedirector() {
  const token = localStorage.getItem("accessToken");
  const rawRole = localStorage.getItem("userRole");
  const role = (rawRole || "").toLowerCase();

  if (!token || token === "null" || token === "undefined") {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  if (role === "student") {
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
}
