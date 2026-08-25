import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const payrollPeriodSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên kỳ lương là bắt buộc (VD: Tháng 09/2026)"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Ngày bắt đầu kỳ lương là bắt buộc"],
    },
    endDate: {
      type: Date,
      required: [true, "Ngày kết thúc kỳ lương là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["OPEN", "CALCULATED", "CONFIRMED", "PAID", "LOCKED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

payrollPeriodSchema.index({ startDate: 1, endDate: 1 });
payrollPeriodSchema.index({ status: 1 });

payrollPeriodSchema.plugin(softDeletePlugin);

export default model("PayrollPeriod", payrollPeriodSchema);
