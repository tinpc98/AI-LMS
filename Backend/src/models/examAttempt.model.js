import mongoose from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "PARTIALLY_GRADED", "GRADED"],
      default: "IN_PROGRESS",
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.Mixed, // Hỗ trợ ObjectId (Legacy) hoặc String/UUID (Snapshot)
          required: true,
        },
        questionSource: {
          type: String,
          enum: ["legacy", "snapshot"],
          default: "legacy",
        },
        selectedOption: { type: String },
        essayText: { type: String },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    totalScore: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    cheatCount: {
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
            "MULTIPLE_FACES",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cheatWarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

examAttemptSchema.plugin(softDeletePlugin);

export default mongoose.model("ExamAttempt", examAttemptSchema);
