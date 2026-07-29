import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "approved", "rejected", "superseded"],
      default: "draft",
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyPoints: [
      {
        type: String,
        trim: true,
      }
    ],
    suggestedReviewTopics: [
      {
        type: String,
        trim: true,
      }
    ],
    sourceFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    sourceWarnings: [
      {
        type: String,
      }
    ],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    aiUsageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIUsage",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
aiSummarySchema.index({ lessonId: 1, status: 1, version: -1 });
aiSummarySchema.index({ lessonId: 1, sourceFingerprint: 1 });

const AISummary = mongoose.model("AISummary", aiSummarySchema);
export default AISummary;
