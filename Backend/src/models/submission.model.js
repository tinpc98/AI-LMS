import mongoose from "mongoose";
const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      // Lưu thêm classId để truy vấn bảng điểm của cả lớp cho nhanh
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    content: {
      type: String, // Học sinh có thể gửi câu trả lời bằng chữ thay vì file
      trim: true,
    },
    // File bài làm của học sinh đẩy lên Cloudinary
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "late", "graded"], // Nộp đúng hạn / Nộp trễ / Đã chấm điểm
      default: "submitted",
    },
    grade: {
      type: Number,
      min: 0,
      max: 100, // Thang điểm 10 hay 100 tùy bạn quyết định ở Controller
      default: null,
    },
    feedback: {
      type: String, // Lời phê của giáo viên
      trim: true,
    },
  },
  { timestamps: true },
);
// Ràng buộc thực chiến: Mỗi học sinh chỉ được nộp 1 bản Submission cho 1 Assignment
// Nếu muốn nộp lại, sẽ update bản ghi này chứ không tạo thêm document rác
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
