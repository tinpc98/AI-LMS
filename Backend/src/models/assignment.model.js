import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài tập là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Đính kèm file đề bài (tận dụng lại cấu trúc file Cloudinary đã làm)
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    lessonId: {
      // Tùy chọn: Bài tập có thể gắn liền với 1 bài giảng cụ thể hoặc bài tập chung của lớp
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
