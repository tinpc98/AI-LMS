import mongoose, { Schema, model } from "mongoose";

const examQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    points: { type: Number, required: true },
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    title: { type: String, required: [true, "Tiêu đề đề thi là bắt buộc"], trim: true },
    duration: { type: Number, required: [true, "Thời gian làm bài là bắt buộc"] }, // Thời gian làm bài (phút)

    questions: [examQuestionSchema],

    startTime: {
      type: Date,
      required: [true, "Thời gian bắt đầu thi là bắt buộc"],
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Lớp học liên kết là bắt buộc"],
    },

    // Người tạo bài thi
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Cờ đánh dấu đề thi được tạo tự động bằng AI
    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    // Prompt AI được sử dụng
    aiPromptUsed: {
      type: String,
      trim: true,
      default: null,
    },

    maxScore: {
      type: Number,
      default: 10,
      max: 10,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "COMPLETED"],
      default: "PUBLISHED",
    },
  },
  { timestamps: true }
);

// Indexes phục vụ tìm kiếm nhanh
examSchema.index({ classId: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });

// Pre-save hook: Kích hoạt tự động kiểm tra tổng điểm phải chuẩn 10 trước khi lưu vào Database
examSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    const currentTotal = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    // Dùng toFixed(2) để tránh lỗi số thập phân của Javascript (vd: 0.1 + 0.2 = 0.300000004)
    if (parseFloat(currentTotal.toFixed(2)) !== 10) {
      return next(
        new Error(
          `Tổng điểm của đề thi phải bằng đúng 10. Tổng hiện tại: ${currentTotal}`
        )
      );
    }
  }
  next();
});

const Exam = model("Exam", examSchema);
export default Exam;
