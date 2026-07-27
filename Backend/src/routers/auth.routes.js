// File: src/routers/auth.routes.js
import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMyProfile,
  updateMyProfile,
  changePassword,
  resetPassword,
  forgotPassword,
} from "../controllers/auth.controllers.js";
import { verifyUser, isTeacher, isAdmin } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);

// Protected routes - User must be authenticated
router.post("/logout", verifyUser, logout);
router.get("/profile", verifyUser, getMyProfile);
router.put("/profile", verifyUser, updateMyProfile);
router.put("/change-password", verifyUser, changePassword);

export default router;
