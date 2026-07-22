import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: Number, required: true }, // Thời gian làm bài (phút)

    // Thiết kế này giúp giáo viên tự phân bổ điểm (VD: 15 câu x 0.266 điểm + 2 câu tự luận x 3 điểm)
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        points: { type: Number, required: true },
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class", // Đảm bảo tên ref khớp với tên model Lớp học của bạn
      required: true,
    },
    maxScore: {
      type: Number,
      default: 10,
      max: 10, // Đảm bảo không bao giờ vượt quá thang điểm 10
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
      default: "PUBLISHED",
    },
  },
  { timestamps: true },
);

// Pre-save hook: Kích hoạt tự động kiểm tra tổng điểm phải chuẩn 10 trước khi lưu vào Database
examSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    const currentTotal = this.questions.reduce((sum, q) => sum + q.points, 0);
    // Dùng toFixed(2) để tránh lỗi số thập phân của Javascript (vd: 0.1 + 0.2 = 0.300000004)
    if (parseFloat(currentTotal.toFixed(2)) !== 10) {
      return next(
        new Error(
          `Tổng điểm của đề thi phải bằng đúng 10. Tổng hiện tại: ${currentTotal}`,
        ),
      );
    }
  }
});

export default mongoose.model("Exam", examSchema);
