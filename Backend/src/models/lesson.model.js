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
    // --- CÁC TRƯỜNG BỔ SUNG THỰC CHIẾN ---
    order: {
      type: Number,
      default: 0,
      // Khi FE gọi tạo bài, có thể truyền order vào để xếp vị trí
    },
    isPublished: {
      type: Boolean,
      default: true, // Mặc định tạo ra là hiển thị luôn (hoặc false tuỳ bạn)
    },
    duration: {
      type: Number, // Lưu thời gian học dự kiến (tính bằng phút)
      default: 0,
    },
    // --------------------------------------
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

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
