import mongoose, { Schema, model } from "mongoose";

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

// Compound Unique Index: Đảm bảo một học sinh chỉ có duy nhất 1 bản ghi điểm danh mỗi ngày trong một lớp
attendanceSchema.index(
  { classId: 1, studentId: 1, date: 1 },
  { unique: true }
);

// Index bổ trợ phục vụ thống kê theo lớp hoặc theo học sinh
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ studentId: 1 });

const Attendance = model("Attendance", attendanceSchema);
export default Attendance;
