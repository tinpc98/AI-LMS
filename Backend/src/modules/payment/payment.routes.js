import { Router } from "express";
import {
  GetPaymentConfig,
  UpdatePaymentConfig,
  AdminCreatePayment,
  getMyPayments,
  getPendingPaymentsAdmin,
  GetPaymentDetail,
  submitPayment,
  confirmPayment,
  rejectPayment,
  CancelPayment,
  RefundPayment,
} from "./payment.controller.js";
import { verifyUser } from "#modules/auth/auth.middleware.js";
import { isAdmin, isStudent } from "#shared/middlewares/rbac.middleware.js";

const route = Router();

// Lấy config (Student cần biết lấy QR, nên ai đăng nhập cũng xem được)
route.get("/config", verifyUser, GetPaymentConfig);

// Cập nhật config (Chỉ Admin)
route.put("/config", verifyUser, isAdmin, UpdatePaymentConfig);

// ── APIs dành cho Admin ───────────────────────────────────────────────────────
route.post("/admin", verifyUser, isAdmin, AdminCreatePayment);
route.get("/admin/pending", verifyUser, isAdmin, getPendingPaymentsAdmin);
route.post("/:id/confirm", verifyUser, isAdmin, confirmPayment);
route.post("/:id/reject", verifyUser, isAdmin, rejectPayment);
route.patch("/:id/refund", verifyUser, isAdmin, RefundPayment);

// ── APIs dành cho Student ─────────────────────────────────────────────────────
route.post("/:id/submit", verifyUser, isStudent, submitPayment);
route.get("/me", verifyUser, isStudent, getMyPayments);

// ── APIs chung (Chi tiết và Hủy) ──────────────────────────────────────────────
route.get("/:id", verifyUser, GetPaymentDetail);
route.patch("/:id/cancel", verifyUser, CancelPayment);

export default route;
