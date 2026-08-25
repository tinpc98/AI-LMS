import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const migrateExams = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Exam migration");

    const db = mongoose.connection.db;

    // 1. Migrate Exams
    const examsCollection = db.collection("exams");
    const oldExams = await examsCollection.find({}).toArray();
    console.log(`Found ${oldExams.length} exams to check for migration`);

    let examMigratedCount = 0;
    for (const exam of oldExams) {
      if (exam.topicId) continue; // Đã migrate
      
      console.log(`Migrating exam: ${exam.title} (${exam._id})`);
      await examsCollection.updateOne(
        { _id: exam._id },
        {
          $set: {
            status: "ARCHIVED",
            isLegacy: true,
          }
        }
      );
      examMigratedCount++;
    }

    // 2. Migrate ExamAttempts
    const attemptsCollection = db.collection("examattempts");
    const oldAttempts = await attemptsCollection.find({}).toArray();
    console.log(`Found ${oldAttempts.length} old attempts to check for migration`);

    let attemptMigratedCount = 0;
    for (const attempt of oldAttempts) {
      if (attempt.attemptNumber !== undefined) continue; // Đã migrate hoặc cấu trúc mới
      
      await attemptsCollection.updateOne(
        { _id: attempt._id },
        {
          $set: {
            status: "GRADED", // Hoặc trạng thái cũ nếu an toàn
            isLegacy: true,
            attemptNumber: 1 // Gán giá trị mặc định tránh lỗi index mới
          }
        }
      );
      attemptMigratedCount++;
    }

    console.log(`Migration completed successfully. Migrated ${examMigratedCount} exams and ${attemptMigratedCount} attempts.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateExams();
