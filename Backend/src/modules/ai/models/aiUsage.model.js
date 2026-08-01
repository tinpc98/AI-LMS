import mongoose from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const aiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: {
      type: String,
      enum: ["summary", "question-gen", "exam-gen", "grading", "chatbot"],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: "google-gemini",
    },
    model: {
      type: String,
      required: true,
      default: "gemini-1.5-flash",
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0, // USD
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "success", "error", "timeout", "invalid_output"],
      default: "pending",
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    promptHash: {
      type: String,
      default: null,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    referenceType: {
      type: String,
      default: null,
    },
    quotaState: {
      type: String,
      enum: ["reserved", "consumed", "refunded"],
      required: true,
      default: "reserved",
      index: true,
    },
    quotaDateString: {
      type: String,
      required: true,
    },
    quotaRefundedAt: {
      type: Date,
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

aiUsageSchema.plugin(softDeletePlugin);

// Compound indexes for analytical queries and quota calculations
aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ userId: 1, feature: 1, createdAt: -1 });

export default mongoose.model("AIUsage", aiUsageSchema);
