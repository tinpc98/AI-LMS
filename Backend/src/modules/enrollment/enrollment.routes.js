import { Router } from "express";
import {
  createEnrollment,
  createEnrollmentByAdmin,
  getMyEnrollments,
  getAllEnrollments,
  getEnrollmentById,
  approveEnrollment,
  assignClass,
  completeEnrollment,
  cancelEnrollment,
  getAdminPendingClass,
} from "./enrollment.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

/**
 * Middleware: chỉ cho phép Student.
 */
const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập." });
  }
  const role = (req.user.role || "").toLowerCase();
  if (role !== "student") {
    return res.status(403).json({
      message: "Chỉ học sinh mới được thực hiện hành động này.",
    });
  }
  next();
};

// ── Student routes ───────────────────────────────────────────────────────────
router.get("/me", verifyUser, isStudent, getMyEnrollments);
router.post("/", verifyUser, isStudent, createEnrollment);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.post("/admin", verifyUser, isAdmin, createEnrollmentByAdmin);
router.get("/admin/pending-class", verifyUser, isAdmin, getAdminPendingClass);
router.get("/", verifyUser, isAdmin, getAllEnrollments);

// ── Status transition routes (Admin) ─────────────────────────────────────────
// Đường thật để duyệt thanh toán là POST /payments/:id/confirm (payment.service.js#confirmPayment,
// chuyển thẳng Enrollment PAYMENT_PENDING_CONFIRMATION -> APPROVED). Route /approve dưới đây là
// đường duyệt thủ công dự phòng cho admin, dùng chung STATUS_TRANSITIONS.
router.patch("/:id/approve", verifyUser, isAdmin, approveEnrollment);
router.post("/:id/assign-class", verifyUser, isAdmin, assignClass);
router.patch("/:id/complete", verifyUser, isAdmin, completeEnrollment);

// Cancel: Admin hoặc Student (student chỉ PENDING_PAYMENT của chính mình)
router.patch("/:id/cancel", verifyUser, cancelEnrollment);

// ── Detail route ─────────────────────────────────────────────────────────────
router.get("/:id", verifyUser, getEnrollmentById);

export default router;
