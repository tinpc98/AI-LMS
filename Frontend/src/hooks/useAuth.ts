import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import type User from "../interface/userInterface";

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const loginSuccess = (token: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userRole", userData.role || "");
    setUser(userData);
  };

  useEffect(() => {
    const handleForceLogout = () => {
      logout();
    };

    window.addEventListener("unauthorized-logout", handleForceLogout);
    return () => {
      window.removeEventListener("unauthorized-logout", handleForceLogout);
    };
  }, [logout]);
  const role = (user?.role || "").toLowerCase();
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isAdmin = role === "admin";

  return {
    user,
    isAuthenticated: !!user,
    role,
    isTeacher,
    isStudent,
    isAdmin,
    loginSuccess,
    logout,
  };
};
