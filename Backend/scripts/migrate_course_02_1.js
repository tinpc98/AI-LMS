import "dotenv/config";
import mongoose from "mongoose";
import Course from "../src/modules/course/course.model.js";
import { connectDB } from "../src/config/database.js";

async function runMigration() {
  console.log("Starting Course Schema Migration (Domain 02.1)...");
  try {
    await connectDB();
    console.log("Connected to database");

    const courses = await Course.find({}).withDeleted();
    console.log(`Found ${courses.length} courses to migrate.`);

    for (const course of courses) {
      let changed = false;

      // 1. Map courseName -> name
      if (course.get("courseName") && !course.get("name")) {
        course.set("name", course.get("courseName"));
        course.set("courseName", undefined);
        changed = true;
      }

      // 2. Add code if missing
      if (!course.get("code")) {
        const generatedCode = `COURSE-${course._id.toString().substring(0, 6).toUpperCase()}`;
        course.set("code", generatedCode);
        changed = true;
      }

      // 3. Set default level if missing
      if (!course.get("level")) {
        course.set("level", "FOUNDATION");
        changed = true;
      }

      // 4. Map durationWeeks -> duration
      if (course.get("durationWeeks") !== undefined && !course.get("duration")) {
        course.set("duration", {
          value: course.get("durationWeeks") > 0 ? course.get("durationWeeks") : 1,
          unit: "WEEK",
        });
        course.set("durationWeeks", undefined);
        changed = true;
      } else if (!course.get("duration")) {
        course.set("duration", {
          value: 1,
          unit: "WEEK",
        });
        changed = true;
      }

      // 5. Map old statuses
      const currentStatus = course.get("status");
      if (currentStatus === "Draft") {
        course.set("status", "DRAFT");
        changed = true;
      } else if (currentStatus === "Published") {
        course.set("status", "PUBLISHED");
        changed = true;
      } else if (currentStatus === "Closed") {
        course.set("status", "ARCHIVED");
        changed = true;
      }

      // 6. Move tuitionFee to pricing.tuitionFee
      if (course.get("tuitionFee") !== undefined) {
        course.set("pricing", { tuitionFee: course.get("tuitionFee") });
        course.set("tuitionFee", undefined);
        changed = true;
      }

      // 7. Unset totalLessons and target
      if (course.get("totalLessons") !== undefined) {
        course.set("totalLessons", undefined);
        changed = true;
      }
      if (course.get("target") !== undefined) {
        course.set("target", undefined);
        changed = true;
      }

      if (changed) {
        await course.save({ validateBeforeSave: false });
        console.log(`Migrated course: ${course._id}`);
      }
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
