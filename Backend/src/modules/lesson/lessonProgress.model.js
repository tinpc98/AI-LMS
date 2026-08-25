import mongoose, { Schema, model } from "mongoose";

const lessonProgressSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Tiến độ granular 0-100 của MỘT bài giảng (vd: % video đã xem). Hiện phía frontend
    // chỉ gửi completed=true/false (chưa có UI theo dõi % dở dang), nên controller quy đổi
    // completed -> 100/0. Field tồn tại sẵn để khi có tracking granular thật (video watch %,
    // scroll %...) chỉ cần gửi progress trực tiếp, không cần đổi lại schema/công thức tính
    // tiến độ lớp học (xem classProgressCalculator.js).
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export default model("LessonProgress", lessonProgressSchema);
