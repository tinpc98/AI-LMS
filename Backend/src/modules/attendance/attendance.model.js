import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const attendanceSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ClassSession",
      required: [true, "ID buổi học (Session) là bắt buộc"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh được điểm danh là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["DRAFT", "PRESENT", "ABSENT", "LATE", "EXCUSED"],
      default: "DRAFT",
      required: [true, "Trạng thái điểm danh là bắt buộc"],
    },
    evidence: {
      firstJoinAt: { type: Date, default: null },
      lastLeaveAt: { type: Date, default: null },
      onlineDurationSeconds: { type: Number, default: 0 },
    },
    note: {
      type: String,
      trim: true,
      default: "",
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
  },
  { timestamps: true }
);

// Single Source of Truth for Unique Attendance
attendanceSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
attendanceSchema.index({ classId: 1, studentId: 1 });

attendanceSchema.plugin(softDeletePlugin);

const Attendance = model("Attendance", attendanceSchema);
export default Attendance;
