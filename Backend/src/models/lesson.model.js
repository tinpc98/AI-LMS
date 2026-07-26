import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài giảng là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Bài giảng phải thuộc về một lớp học cụ thể"],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bài giảng phải có giáo viên phụ trách"],
    },
  },
  { timestamps: true },
);

// Indexes nâng cao tốc độ truy vấn bài giảng theo lớp
lessonSchema.index({ classId: 1, isPublished: 1, order: 1 });
lessonSchema.index({ teacherId: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
