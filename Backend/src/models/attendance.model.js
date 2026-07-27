import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const attendanceSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID giáo viên điểm danh là bắt buộc"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh được điểm danh là bắt buộc"],
    },
    date: {
      type: Date,
      required: [true, "Ngày điểm danh là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Excused"],
      default: "Present",
      required: [true, "Trạng thái điểm danh là bắt buộc"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người tạo bản ghi là bắt buộc"],
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { classId: 1, studentId: 1, date: 1 },
  { unique: true }
);

attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ studentId: 1 });

attendanceSchema.plugin(softDeletePlugin);

const Attendance = model("Attendance", attendanceSchema);
export default Attendance;
