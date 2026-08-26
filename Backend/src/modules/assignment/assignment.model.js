import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";
import { contentBlockSchema } from "../question/question.model.js";

const assignmentQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
  },
  { _id: false }
);

const solutionResourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["VIDEO", "DOCUMENT"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    questionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  { _id: true }
);

const assignmentSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Chủ đề (Topic) là bắt buộc"],
    },
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
    instructions: [contentBlockSchema],
    questions: [assignmentQuestionSchema],
    // TÍNH NĂNG MỚI: deadline thật, mirror đúng pattern của Exam (exam.model.js) — trước đây
    // Assignment không có cách nào tính hạn nộp (assignedAfterSessionId/dueBeforeSessionId cũ
    // tham chiếu model LiveSession đã bị xóa khỏi codebase, không dùng được — đã bỏ 2 field đó).
    duration: {
      type: Number,
      required: [true, "Thời gian làm bài là bắt buộc (phút)"],
      min: 1,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    solutionResources: [solutionResourceSchema],
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

// Mirror exam.model.js: startAt phải nhỏ hơn endAt nếu cả 2 được set.
assignmentSchema.pre("validate", function () {
  if (this.startAt && this.endAt && this.startAt >= this.endAt) {
    this.invalidate("startAt", "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.");
  }
});

// Indexes
assignmentSchema.index({ topicId: 1, status: 1 });
assignmentSchema.index({ createdBy: 1 });

assignmentSchema.plugin(softDeletePlugin);

export default model("Assignment", assignmentSchema);
