import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";
import { contentBlockSchema } from "../question/question.model.js";

const examQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const examSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Lớp học (Class) là bắt buộc"],
    },
    title: {
      type: String,
      required: [true, "Tiêu đề đề thi là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    instructions: [contentBlockSchema],
    questions: [examQuestionSchema],
    duration: {
      type: Number,
      required: [true, "Thời gian làm bài là bắt buộc (phút)"],
      min: 1,
    },
    attemptsAllowed: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    scorePolicy: {
      type: String,
      enum: ["HIGHEST", "LATEST"],
      default: "HIGHEST",
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
examSchema.index({ topicId: 1, status: 1 });
examSchema.index({ createdBy: 1 });

// Validation
examSchema.pre("validate", function () {
  if (this.startAt && this.endAt) {
    if (this.startAt >= this.endAt) {
      this.invalidate("startAt", "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
    }
  }
  if (this.status === "PUBLISHED") {
    if (!this.questions || this.questions.length === 0) {
      this.invalidate("questions", "Đề thi PUBLISHED phải có ít nhất 1 câu hỏi.");
    }
  }
});

examSchema.plugin(softDeletePlugin);

export default model("Exam", examSchema);
