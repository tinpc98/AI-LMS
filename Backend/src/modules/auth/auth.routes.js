// File: src/routes/auth.routes.js
// Xác thực & hồ sơ cá nhân của chính người dùng đang đăng nhập.
// Tách khỏi user.routes.js ở Wave 2.5: trước đây một router duy nhất được mount ở CẢ
// /api/auth lẫn /api/users, khiến mọi endpoint quản trị người dùng cũng truy cập được
// qua /api/auth và ngược lại — sơ đồ URL nhân đôi, không phản ánh đúng phân quyền.
import { Router } from "express";
import { getMyProfile, login, updateMyProfile } from "./auth.controller.js";
import { loginValidation } from "./auth.validator.js";
import { verifyUser } from "./auth.middleware.js";
import { loginRateLimit } from "./loginRateLimit.middleware.js";

const route = Router();

route.post("/login", loginRateLimit, loginValidation, login);
route.get("/me", verifyUser, getMyProfile);
route.put("/me", verifyUser, updateMyProfile);

export default route;
