import mongoose from "mongoose";
import "dotenv/config";

import Subject from "../subject.model.js";
import { Course } from "../../course/index.js";
import User from "../../auth/user.model.js";

const SUBJECT_MAP = {
  Mathematics: { name: "Toán", code: "TOAN" },
  "Toán học": { name: "Toán", code: "TOAN" },
  Physics: { name: "Vật lý", code: "LY" },
  Chemistry: { name: "Hóa học", code: "HOA" },
  English: { name: "Tiếng Anh", code: "TIENG_ANH" },
  Literature: { name: "Ngữ văn", code: "VAN" },
};

async function migrate() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected.");

    // Lấy một admin để gán createdBy (nếu chưa có subject)
    const admin = await User.findOne({ role: "Admin" });
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    console.log("Scanning Courses with string subject...");
    const courses = await Course.find({ subject: { $exists: true, $type: "string" } });

    console.log(`Found ${courses.length} courses to migrate.`);

    let migrated = 0;
    let skipped = 0;
    let unresolved = 0;
    let failed = 0;

    for (const course of courses) {
      const subjectString = course.get("subject");
      
      if (!subjectString) {
        skipped++;
        continue;
      }

      const mapped = SUBJECT_MAP[subjectString];
      if (!mapped) {
        console.warn(`[WARN] Unresolved subject text: "${subjectString}" for course ${course._id}`);
        unresolved++;
        continue;
      }

      try {
        // Tìm hoặc tạo Subject
        let subjectDoc = await Subject.findOne({ code: mapped.code });
        if (!subjectDoc) {
          subjectDoc = await Subject.create({
            name: mapped.name,
            code: mapped.code,
            description: `Môn ${mapped.name}`,
            status: "ACTIVE", // Đã dùng cho course thì nên ACTIVE luôn
            createdBy: adminId,
            updatedBy: adminId,
          });
          console.log(`Created new Subject: ${mapped.code}`);
        }

        // Cập nhật Course
        course.set("subjectId", subjectDoc._id);
        // Remove old field
        course.set("subject", undefined);
        
        await course.save({ validateModifiedOnly: true });
        migrated++;
      } catch (err) {
        console.error(`[ERROR] Failed to migrate course ${course._id}:`, err.message);
        failed++;
      }
    }

    console.log("--- MIGRATION REPORT ---");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Unresolved: ${unresolved}`);
    console.log(`Failed: ${failed}`);
    console.log("------------------------");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

migrate();
