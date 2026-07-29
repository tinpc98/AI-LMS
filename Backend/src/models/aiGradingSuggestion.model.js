import mongoose, { Schema } from "mongoose";

const criterionScoreSchema = new Schema(
  {
    criterion: { type: String, required: true },
    scoreEarned: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    feedback: { type: String, required: true },
  },
  { _id: false }
);

const aiGradingSuggestionSchema = new Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamAttempt",
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    suggestedScore: {
      type: Number,
      required: true,
      min: 0,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    aiFeedback: {
      type: String,
      required: true,
    },
    criterionScores: {
      type: [criterionScoreSchema],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
    model: {
      type: String,
    },
    promptVersion: {
      type: String,
    },
    sourceFingerprint: {
      type: String, // hash để phục vụ idempotency
      required: true,
      index: true,
    },
    aiUsageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIUsage",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "ACCEPTED", "REJECTED", "SUPERSEDED"],
      default: "PENDING_REVIEW",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AIGradingSuggestion", aiGradingSuggestionSchema);
