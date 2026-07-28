import { Router } from "express";
import {
  getMyProfile,
  login,
  updateMyProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserTrash,
  restoreUser,
  permanentDeleteUser,
} from "../controllers/auth.controllers.js";
import { loginValidation } from "../utils/validators.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";

const route = Router();

// Auth routes công khai & cá nhân
route.post("/login", loginValidation, login);
route.get("/me", verifyUser, getMyProfile);
route.put("/me", verifyUser, updateMyProfile);

// Admin User Management routes
route.get("/trash", verifyUser, isAdmin, getUserTrash);
route.get("/", verifyUser, isAdmin, getAllUsers);
route.post("/", verifyUser, isAdmin, createUser);
route.get("/:id", verifyUser, isAdmin, getUserById);
route.put("/:id", verifyUser, isAdmin, updateUser);
route.delete("/:id", verifyUser, isAdmin, deleteUser);
route.patch("/:id/restore", verifyUser, isAdmin, restoreUser);
route.delete("/:id/force", verifyUser, isAdmin, permanentDeleteUser);

export default route;
