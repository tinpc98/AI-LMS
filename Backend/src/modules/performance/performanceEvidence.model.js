import mongoose, { Schema, model } from "mongoose";

const performanceEvidenceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    sourceType: {
      type: String,
      enum: ["ASSIGNMENT", "EXAM"],
      required: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId, // Could be AssignmentAttemptId or ExamAttemptId
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Idempotency constraint: A question from a specific attempt can only be processed once
performanceEvidenceSchema.index(
  { studentId: 1, sourceType: 1, sourceId: 1, questionId: 1 },
  { unique: true }
);

// Fast lookup for rebuilding performance
performanceEvidenceSchema.index({ studentId: 1, topicId: 1, isCorrect: 1 });

export default model("PerformanceEvidence", performanceEvidenceSchema);
