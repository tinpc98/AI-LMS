// File: src/modules/complaint/complaint.routes.js
import { Router } from "express";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";
import {
  createComplaint,
  markComplaintResponded,
  closeComplaint,
  listOverdueComplaints,
} from "./complaint.controller.js";

const router = Router();

// Ai cũng có thể nộp khiếu nại (Student/Teacher/Admin) — chỉ cần đăng nhập.
router.post("/", verifyUser, createComplaint);

// Xử lý khiếu nại là việc của Admin (không có role Ops riêng — xem "Ghi chú phương pháp").
router.get("/overdue", verifyUser, isAdmin, listOverdueComplaints);
router.patch("/:id/respond", verifyUser, isAdmin, markComplaintResponded);
router.patch("/:id/resolve", verifyUser, isAdmin, closeComplaint);

export default router;
