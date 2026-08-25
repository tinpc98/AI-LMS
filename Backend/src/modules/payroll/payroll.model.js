import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const payrollItemSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "ClassSession", default: null },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    description: { type: String, required: true },
    calculationType: {
      type: String,
      enum: ["PER_SESSION", "PER_COURSE"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const payrollSchema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID giáo viên là bắt buộc"],
    },
    payrollPeriodId: {
      type: Schema.Types.ObjectId,
      ref: "PayrollPeriod",
      required: [true, "ID kỳ lương là bắt buộc"],
    },
    baseAmount: {
      type: Number,
      default: 0,
    },
    sessionCount: {
      type: Number,
      default: 0,
    },
    courseCount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "CALCULATED", "CONFIRMED", "PAID", "LOCKED"],
      default: "DRAFT",
    },
    items: [payrollItemSchema],
    calculatedAt: { type: Date, default: null },
    calculatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    confirmedAt: { type: Date, default: null },
    confirmedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paidAt: { type: Date, default: null },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    lockedAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// Single Source of Truth for Unique Payroll per Teacher per Period
payrollSchema.index(
  { teacherId: 1, payrollPeriodId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
payrollSchema.index({ status: 1 });

payrollSchema.plugin(softDeletePlugin);

export default model("Payroll", payrollSchema);
