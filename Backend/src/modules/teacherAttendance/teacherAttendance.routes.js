import { Router } from "express";
import {
  getMyAttendance,
  getAllAttendanceAdmin,
  confirmAttendance,
  overrideAttendanceAdmin,
} from "./teacherAttendance.controller.js";
import { verifyUser } from "#modules/auth/index.js";
import { isTeacher, isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

// ==========================
// TEACHER ROUTES
// ==========================
router.get("/my", verifyUser, isTeacher, getMyAttendance);
router.post("/:id/confirm", verifyUser, isTeacher, confirmAttendance);

// ==========================
// ADMIN ROUTES
// ==========================
router.get("/", verifyUser, isAdmin, getAllAttendanceAdmin);
router.post("/:id/override", verifyUser, isAdmin, overrideAttendanceAdmin);

export default router;
