import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const teacherAttendanceSchema = new Schema(
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
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID giáo viên là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "ABSENT"],
      default: "PENDING",
      required: [true, "Trạng thái là bắt buộc"],
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedOutAt: {
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
    note: {
      type: String,
      trim: true,
      default: "",
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Single Source of Truth for Unique Teacher Attendance per Session
teacherAttendanceSchema.index({ sessionId: 1, teacherId: 1 }, { unique: true });
teacherAttendanceSchema.index({ classId: 1, teacherId: 1 });
teacherAttendanceSchema.index({ status: 1 });

teacherAttendanceSchema.plugin(softDeletePlugin);

export default model("TeacherAttendance", teacherAttendanceSchema);
