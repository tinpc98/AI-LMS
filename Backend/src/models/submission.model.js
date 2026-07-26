import mongoose, { Schema, model } from "mongoose";

const submissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "ID bài tập là bắt buộc"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh nộp bài là bắt buộc"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    // File bài làm đẩy lên Cloudinary
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      default: "submitted",
    },
    // Điểm số giữ nguyên
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Lời phê của giáo viên
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    // Phản hồi / Đánh giá tự động từ AI
    aiFeedback: {
      type: String,
      trim: true,
      default: "",
    },
    // Người thực hiện chấm điểm (Giáo viên hoặc Admin)
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Thời điểm thực hiện chấm điểm
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique Index: Mỗi học sinh chỉ được nộp 1 bản Submission cho 1 Assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ classId: 1, studentId: 1 });
submissionSchema.index({ gradedBy: 1 });

const Submission = model("Submission", submissionSchema);
export default Submission;
