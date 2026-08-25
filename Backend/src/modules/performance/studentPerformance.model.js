import mongoose, { Schema, model } from "mongoose";

const studentPerformanceSchema = new Schema(
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
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    answeredQuestions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    incorrectAnswers: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    totalAttempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    masteryLevel: {
      type: String,
      enum: ["FOUNDATIONAL", "DEVELOPING", "PROFICIENT", "MASTERED"],
      default: "FOUNDATIONAL",
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate records per student/course/topic
studentPerformanceSchema.index(
  { studentId: 1, courseId: 1, topicId: 1 },
  { unique: true }
);

// Query optimizations
studentPerformanceSchema.index({ studentId: 1, courseId: 1 });
studentPerformanceSchema.index({ topicId: 1, masteryLevel: 1 });

export default model("StudentPerformance", studentPerformanceSchema);
