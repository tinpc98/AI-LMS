import mongoose, { Schema } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";
import { contentBlockSchema } from "../question/question.model.js";

const optionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    content: [contentBlockSchema],
    order: { type: Number, required: true },
  },
  { _id: false }
);

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
    },
    points: {
      type: Number,
      required: true,
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

const examAttemptSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
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
      enum: ["IN_PROGRESS", "SUBMITTED", "PARTIALLY_GRADED", "GRADED"],
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
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    performanceProcessedAt: {
      type: Date,
      default: null,
    },
    // Anti-Cheat & Legacy integration fields
    cheatWarnings: {
      type: Number,
      default: 0,
    },
    cheatLogs: [
      {
        cheatType: {
          type: String,
          enum: [
            "TAB_SWITCH",
            "FULLSCREEN_EXIT",
            "COPY_PASTE",
            "COPY_ATTEMPT",
            "PASTE_ATTEMPT",
            "MULTIPLE_FACES",
            "NO_FACE_DETECTED",
            "DEVTOOLS_OPEN",
            "RIGHT_CLICK",
            "WINDOW_BLUR",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sessionToken: {
      type: String,
      required: true,
    },
    activeTabId: {
      type: String,
    },
    takeoverCount: {
      type: Number,
      default: 0,
    },
    deviceLogs: [
      {
        ip: String,
        userAgent: String,
        takeoverTime: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isLate: {
      type: Boolean,
      default: false,
    },
    lateBySeconds: {
      type: Number,
      default: 0,
    },
    answersVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

examAttemptSchema.plugin(softDeletePlugin);

// Compound Index quan trọng cho attempts
examAttemptSchema.index(
  { examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

examAttemptSchema.index({ examId: 1, studentId: 1, status: 1 });
examAttemptSchema.index({ sessionToken: 1 });

export default mongoose.model("ExamAttempt", examAttemptSchema);
