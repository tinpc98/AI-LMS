import mongoose, { Schema, model } from "mongoose";

const weaknessSchema = new Schema(
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
    weaknessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    attemptCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    evidence: {
      type: String,
      trim: true,
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One active weakness tracking per topic
weaknessSchema.index(
  { studentId: 1, courseId: 1, topicId: 1 },
  { unique: true }
);

weaknessSchema.index({ studentId: 1, severity: 1 });

export default model("Weakness", weaknessSchema);
