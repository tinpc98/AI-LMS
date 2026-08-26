import { Schema, model } from "mongoose";

const VALID_PAYMENT_STATUSES = ["PENDING", "PAID", "REJECTED", "EXPIRED", "CANCELLED", "REFUNDED"];

const paymentSchema = new Schema(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    // Snapshot field: must not change if Course price changes
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "VND",
      enum: ["VND"],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["BANK_TRANSFER"],
      default: "BANK_TRANSFER",
    },
    status: {
      type: String,
      required: true,
      enum: VALID_PAYMENT_STATUSES,
      default: "PENDING",
      index: true,
    },
    transferInfo: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountName: { type: String, trim: true },
      transferContent: { type: String, trim: true },
      qrData: { type: String, trim: true }, // Mapped from config or generated URL
    },
    studentSubmittedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // BUG ĐÃ SỬA: refundPayment() trước đây không ghi lại AI đã hoàn tiền và khi nào — không có
    // audit trail cho một thao tác tài chính, trong khi confirm/reject đều có confirmedBy/
    // rejectedBy tương ứng.
    refundedAt: {
      type: Date,
      default: null,
    },
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    refundReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Partial unique: Cho phép nhiều CANCELLED, REFUNDED nhưng chỉ có 1 PENDING/PAID trên cùng 1 enrollment
paymentSchema.index(
  { enrollmentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING", "PAID"] },
    },
  }
);

paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ courseId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = model("Payment", paymentSchema);
export default Payment;
