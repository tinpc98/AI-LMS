import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const progressSchema = new Schema(
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
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
  },
  { timestamps: true }
);

// Unique Index: Mỗi học sinh chỉ có 1 bản ghi progress cho mỗi lớp học
progressSchema.index({ studentId: 1, classId: 1 }, { unique: true });

progressSchema.plugin(softDeletePlugin);

const Progress = model("Progress", progressSchema);
export default Progress;
