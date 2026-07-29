import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const examQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.Mixed, // Could be ObjectId for legacy Question, or String/ObjectId for snapshot ID
      required: true,
    },
    points: { type: Number, required: true },
    isSnapshot: {
      type: Boolean,
      default: false,
    },
    snapshotData: {
      type: Schema.Types.Mixed, // Stores the complete question object from ExamSet
      default: null,
    },
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    title: { type: String, required: [true, "Tiêu đề đề thi là bắt buộc"], trim: true },
    duration: { type: Number, required: [true, "Thời gian làm bài là bắt buộc"] },

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

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isAIGenerated: {
      type: Boolean,
      default: false,
    },

    aiPromptUsed: {
      type: String,
      trim: true,
      default: null,
    },

    aiSourceExamSetId: {
      type: Schema.Types.ObjectId,
      ref: "ExamSet",
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

examSchema.pre("save", function () {
  if (this.questions && this.questions.length > 0) {
    const currentTotal = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    if (parseFloat(currentTotal.toFixed(2)) !== 10) {
      throw new Error(
        `Tổng điểm của đề thi phải bằng đúng 10. Tổng hiện tại: ${currentTotal}`
      );
    }
  }
});

examSchema.plugin(softDeletePlugin);

const Exam = model("Exam", examSchema);
export default Exam;
