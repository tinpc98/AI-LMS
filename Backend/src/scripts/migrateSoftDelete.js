import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { User } from "#modules/auth";
import { Course } from "#modules/course";
import { Class as classModel } from "#modules/class";
import { Lesson } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { Submission } from "#modules/assignment";
import { Question } from "#modules/question";
import { Exam } from "#modules/exam";
import { ExamAttempt } from "#modules/exam-attempt";
import { Attendance } from "#modules/attendance";
import { Grade } from "#modules/grade";
import { Announcement } from "#modules/announcement";
import { LiveSession } from "#modules/live-session";

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
