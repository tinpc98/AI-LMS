import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { User } from "#modules/auth";
import Course from "../models/course.model.js";
import { Class as classModel } from "#modules/class";
import { Lesson } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { Submission } from "#modules/assignment";
import Question from "../models/question.model.js";
import Exam from "../models/exam.model.js";
import ExamAttempt from "../models/examAttempt.model.js";
import { Attendance } from "#modules/attendance";
import Grade from "../models/grade.model.js";
import Announcement from "../models/announcement.model.js";
import LiveSession from "../models/liveSession.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tinpc98_AI-LMS";

export async function runSoftDeleteMigration() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log("[Migration] MongoDB connected successfully.");
    }

    const models = [
      { name: "User", model: User },
      { name: "Course", model: Course },
      { name: "Class", model: classModel },
      { name: "Lesson", model: Lesson },
      { name: "Assignment", model: Assignment },
      { name: "Submission", model: Submission },
      { name: "Question", model: Question },
      { name: "Exam", model: Exam },
      { name: "ExamAttempt", model: ExamAttempt },
      { name: "Attendance", model: Attendance },
      { name: "Grade", model: Grade },
      { name: "Announcement", model: Announcement },
      { name: "LiveSession", model: LiveSession },
    ];

    console.log("[Migration] Starting Soft Delete migration for existing records...");

    for (const { name, model } of models) {
      const result = await model.updateMany(
        { isDeleted: { $exists: false } },
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
          },
        }
      );
      console.log(
        `[Migration] ${name}: Matched ${result.matchedCount}, Modified ${result.modifiedCount}`
      );
    }

    console.log("[Migration] Soft Delete migration completed successfully!");
  } catch (error) {
    console.error("[Migration] Soft Delete migration failed:", error);
  }
}

// Chạy trực tiếp nếu gọi từ CLI
if (process.argv[1] && process.argv[1].endsWith("migrateSoftDelete.js")) {
  runSoftDeleteMigration().then(() => process.exit(0));
}
