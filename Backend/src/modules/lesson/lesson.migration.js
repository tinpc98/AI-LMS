import mongoose from "mongoose";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import Topic from "../topic/topic.model.js";
import Video from "../video/video.model.js";
import Document from "../document/document.model.js";

dotenv.config();

const migrateLessons = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Lesson migration");

    const db = mongoose.connection.db;
    const lessonsCollection = db.collection("lessons");

    const oldLessons = await lessonsCollection.find({}).toArray();
    console.log(`Found ${oldLessons.length} lessons to check for migration`);

    if (oldLessons.length === 0) {
      console.log("No old lessons found. Exiting.");
      process.exit(0);
    }

    // Tạo một Topic mặc định cho các bài giảng mồ côi
    let defaultTopic = await Topic.findOne({ name: "Migrated Lessons Topic" });
    if (!defaultTopic) {
      // Dùng admin user đầu tiên làm người tạo
      const admin = await db.collection("users").findOne({ role: "Admin" });
      const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

      // Course mặc định
      const course = await db.collection("courses").findOne({});
      const courseId = course ? course._id : new mongoose.Types.ObjectId();

      defaultTopic = await Topic.create({
        name: "Migrated Lessons Topic",
        courseId: courseId,
        description: "Topic chứa các bài giảng migrate từ hệ thống cũ",
        order: 999,
      });
    }

    let migratedCount = 0;

    for (const lesson of oldLessons) {
      // Bỏ qua nếu đã được migrate (có topicId)
      if (lesson.topicId) {
        continue;
      }

      console.log(`Migrating lesson: ${lesson.title} (${lesson._id})`);

      const updates = {};
      const unsets = {
        classId: "",
        quiz: "",
        attachments: "",
        videoUrl: "",
        isPublished: "",
        teacherId: "",
        duration: "",
      };

      // 1. Gán topicId
      updates.topicId = defaultTopic._id;

      // 2. Chuyển đổi trạng thái
      updates.status = lesson.isPublished ? "PUBLISHED" : "DRAFT";

      // 3. Chuyển teacherId -> createdBy
      updates.createdBy = lesson.teacherId || defaultTopic.courseId; // Fallback

      // 4. Khởi tạo content array rỗng
      updates.content = [];

      // Nếu có description, đưa description vào content dạng TEXT để bảo toàn lý thuyết
      if (lesson.description) {
        updates.content.push({
          id: uuidv4(),
          type: "TEXT",
          order: 0,
          text: lesson.description,
        });
      }

      // 5. Migrate Video
      updates.videoIds = [];
      if (lesson.videoUrl) {
        const video = await Video.create({
          title: `Video bài: ${lesson.title}`,
          url: lesson.videoUrl,
          uploadedBy: updates.createdBy,
        });
        updates.videoIds.push(video._id);
      }

      // 6. Migrate Documents
      updates.documentIds = [];
      if (lesson.attachments && Array.isArray(lesson.attachments)) {
        for (const att of lesson.attachments) {
          const doc = await Document.create({
            title: att.name || "Tài liệu đính kèm",
            fileUrl: att.url,
            fileType: "UNKNOWN",
            uploadedBy: updates.createdBy,
          });
          updates.documentIds.push(doc._id);
        }
      }

      // Update vào DB
      await lessonsCollection.updateOne(
        { _id: lesson._id },
        {
          $set: updates,
          $unset: unsets,
        }
      );

      migratedCount++;
    }

    console.log(`Migration completed successfully. Migrated ${migratedCount} lessons.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateLessons();
