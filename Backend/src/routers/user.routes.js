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
} from "../controllers/auth.controllers.js";
import { loginValidation } from "../utils/validators.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";

const route = Router();

// Auth routes công khai & cá nhân
route.post("/login", loginValidation, login);
route.get("/me", verifyUser, getMyProfile);
route.put("/me", verifyUser, updateMyProfile);

// Admin User Management routes
route.get("/", verifyUser, isAdmin, getAllUsers);
route.post("/", verifyUser, isAdmin, createUser);
route.get("/:id", verifyUser, isAdmin, getUserById);
route.put("/:id", verifyUser, isAdmin, updateUser);
route.delete("/:id", verifyUser, isAdmin, deleteUser);

export default route;
