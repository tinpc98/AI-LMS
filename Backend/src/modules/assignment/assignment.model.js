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
    assignedAfterSessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession", // Assuming a Session model exists, maybe named LiveSession or Session
    },
    dueBeforeSessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
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

// Indexes
assignmentSchema.index({ topicId: 1, status: 1 });
assignmentSchema.index({ createdBy: 1 });

assignmentSchema.plugin(softDeletePlugin);

export default model("Assignment", assignmentSchema);
