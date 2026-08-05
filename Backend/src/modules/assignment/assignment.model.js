import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài tập là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    maxScore: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 1000,
    },
    // Hình thức nộp bài: 'file' | 'link' | 'direct' | 'any'
    submissionMode: {
      type: String,
      enum: ["file", "link", "direct", "any"],
      default: "file",
    },
    // Danh sách câu hỏi cho hình thức 'direct' hoặc 'any'
    questions: [
      {
        order: { type: Number, default: 1 },
        content: { type: String, required: true }, // HTML đã sanitize
        required: { type: Boolean, default: true },
      },
    ],
    // Đính kèm file đề bài (tận dụng lại cấu trúc Cloudinary)
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    deadline: {
      type: Date,
      required: [true, "Phải có hạn nộp bài (Deadline)"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Lớp học liên kết là bắt buộc"],
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Giáo viên tạo bài tập là bắt buộc"],
    },
    // Người tạo bài tập (Admin hoặc Giáo viên)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Cờ đánh dấu bài tập tạo bằng AI
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    // Prompt AI đã dùng để tạo bài tập (nếu không dùng AI thì null)
    aiPromptUsed: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes tối ưu hiệu năng tìm kiếm
assignmentSchema.index({ classId: 1, createdAt: -1 });
assignmentSchema.index({ classId: 1 });
assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ deadline: 1 });

// Hook gán createdBy = teacherId nếu createdBy chưa được truyền vào
assignmentSchema.pre("validate", function () {
  if (!this.createdBy && this.teacherId) {
    this.createdBy = this.teacherId;
  }
});

assignmentSchema.plugin(softDeletePlugin);

const Assignment = model("Assignment", assignmentSchema);
export default Assignment;
