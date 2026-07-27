import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const gradeSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh là bắt buộc"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    category: {
      type: String,
      enum: ["Attendance", "Assignment", "Midterm", "Final", "Other"],
      required: [true, "Loại cột điểm là bắt buộc"],
    },
    score: {
      type: Number,
      required: [true, "Điểm số là bắt buộc"],
      min: [0, "Điểm số không được nhỏ hơn 0"],
      max: [100, "Điểm số không được vượt quá 100"],
    },
    weight: {
      type: Number,
      default: 1,
      min: [0, "Tỷ trọng không được âm"],
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người chấm điểm là bắt buộc"],
    },
    gradedAt: {
      type: Date,
      default: Date.now,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    aiFeedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

gradeSchema.index({ classId: 1, studentId: 1 });
gradeSchema.index({ studentId: 1, category: 1 });
gradeSchema.index({ gradedBy: 1 });

gradeSchema.plugin(softDeletePlugin);

const Grade = model("Grade", gradeSchema);
export default Grade;
