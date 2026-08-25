import mongoose, { Schema, model } from "mongoose";

const recommendationResourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["LESSON", "ASSIGNMENT", "EXAM", "QUESTION"],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const aiRecommendationSchema = new Schema(
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
    weaknessIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Weakness",
        required: true,
      },
    ],
    recommendedTopics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    recommendedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    recommendedAssignments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
    recommendedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    explanation: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "EXPIRED", "DISMISSED"],
      default: "ACTIVE",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

aiRecommendationSchema.index({ studentId: 1, courseId: 1, status: 1 });
aiRecommendationSchema.index({ "weaknessIds": 1 });

export default model("AIRecommendation", aiRecommendationSchema);
