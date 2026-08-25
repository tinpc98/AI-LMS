import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const payrollConfigSchema = new Schema(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID giáo viên là bắt buộc"],
    },
    type: {
      type: String,
      enum: ["PER_SESSION", "PER_COURSE"],
      required: [true, "Loại lương là bắt buộc"],
    },
    amount: {
      type: Number,
      required: [true, "Mức lương là bắt buộc"],
      min: [0, "Lương không được âm"],
    },
    effectiveFrom: {
      type: Date,
      required: [true, "Ngày bắt đầu hiệu lực là bắt buộc"],
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

payrollConfigSchema.index({ teacherId: 1, type: 1, status: 1 });

payrollConfigSchema.plugin(softDeletePlugin);

export default model("TeacherPayrollConfig", payrollConfigSchema);
