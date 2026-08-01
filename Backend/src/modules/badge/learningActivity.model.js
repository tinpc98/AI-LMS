import mongoose, { Schema } from "mongoose";

const learningActivitySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    activityType: {
      type: String,
      enum: [
        "Lesson Viewed",
        "Lesson Completed",
        "Assignment Submitted",
        "Exam Finished",
        "Attendance",
        "AI Interaction",
      ],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

learningActivitySchema.index({ studentId: 1, classId: 1, createdAt: -1 });

export default mongoose.model("LearningActivity", learningActivitySchema);
