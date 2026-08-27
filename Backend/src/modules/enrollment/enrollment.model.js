import { Schema, model } from "mongoose";

/**
 * Enrollment — Đại diện cho một lần Student đăng ký một Course.
 *
 * Lifecycle:
 *   PENDING_PAYMENT → PAYMENT_PENDING_CONFIRMATION → APPROVED → CLASS_ASSIGNED → COMPLETED
 *   PENDING_PAYMENT / PAYMENT_PENDING_CONFIRMATION / APPROVED → CANCELLED
 *
 * PAYMENT_PENDING_CONFIRMATION → APPROVED được set trực tiếp bởi
 * payment.service.js#confirmPayment (không qua transitionStatus) khi admin duyệt
 * thanh toán; enrollment.service.js#transitionStatus(id, "APPROVED") chỉ là đường
 * duyệt thủ công dự phòng.
 *
 * Partial unique index đảm bảo không có 2 enrollment cùng active
 * cho cùng (studentId, courseId) — chống race condition ở tầng DB.
 */

const ACTIVE_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_PENDING_CONFIRMATION",
  "APPROVED",
  "CLASS_ASSIGNED",
];

const ALL_STATUSES = [...ACTIVE_STATUSES, "REJECTED", "COMPLETED", "CANCELLED"];

const enrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: "PENDING_PAYMENT",
      required: true,
    },
    level: {
      type: String,
      enum: ["FOUNDATION", "INTERMEDIATE", "ADVANCED"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Partial unique: chỉ 1 enrollment active cho mỗi (student, course) tại một thời điểm.
// COMPLETED & CANCELLED được phép trùng → cho re-enrollment.
enrollmentSchema.index(
  { studentId: 1, courseId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ACTIVE_STATUSES },
    },
  }
);

// Query indexes
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });

const Enrollment = model("Enrollment", enrollmentSchema);

export { ACTIVE_STATUSES, ALL_STATUSES };
export default Enrollment;
