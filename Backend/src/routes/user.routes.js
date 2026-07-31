// File: src/routes/user.routes.js
// Quản trị người dùng — toàn bộ endpoint ở đây đều yêu cầu quyền Admin.
// Phần đăng nhập & hồ sơ cá nhân đã tách sang auth.routes.js (Wave 2.5).
import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTrash,
  restoreUser,
  permanentDeleteUser,
} from "../controllers/auth.controller.js";
import { verifyUser, isAdmin } from "#shared/middlewares/auth.middleware.js";

const route = Router();

// "/trash" phải khai báo TRƯỚC "/:id", nếu không Express khớp "trash" thành tham số id.
route.get("/trash", verifyUser, isAdmin, getUserTrash);

route.get("/", verifyUser, isAdmin, getAllUsers);
route.post("/", verifyUser, isAdmin, createUser);
route.get("/:id", verifyUser, isAdmin, getUserById);
route.put("/:id", verifyUser, isAdmin, updateUser);
route.delete("/:id", verifyUser, isAdmin, deleteUser);
route.patch("/:id/restore", verifyUser, isAdmin, restoreUser);
route.delete("/:id/force", verifyUser, isAdmin, permanentDeleteUser);

export default route;
