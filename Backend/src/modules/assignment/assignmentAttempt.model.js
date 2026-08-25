import mongoose, { Schema, model } from "mongoose";
import { contentBlockSchema } from "../question/question.model.js";

// Option Snapshot (without isCorrect)
const optionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    content: [contentBlockSchema],
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

// Question Snapshot
const questionSnapshotSchema = new Schema(
  {
    type: { type: String, required: true },
    content: [contentBlockSchema],
    options: [optionSnapshotSchema],
  },
  { _id: false }
);

const attemptQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionSnapshot: {
      type: questionSnapshotSchema,
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
      default: 1,
    },
    answer: {
      selectedOptionIds: [String],
      content: [contentBlockSchema],
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const assignmentAttemptSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "GRADED"],
      default: "IN_PROGRESS",
    },
    questions: [attemptQuestionSchema],
    score: {
      type: Number,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    performanceProcessedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

assignmentAttemptSchema.index({ assignmentId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
assignmentAttemptSchema.index({ assignmentId: 1, studentId: 1, status: 1 });
assignmentAttemptSchema.index({ startedAt: -1 });

export default model("AssignmentAttempt", assignmentAttemptSchema);
