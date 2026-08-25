import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const migrateAssignments = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Assignment migration");

    const db = mongoose.connection.db;
    const assignmentsCollection = db.collection("assignments");

    const oldAssignments = await assignmentsCollection.find({}).toArray();
    console.log(`Found ${oldAssignments.length} assignments to check for migration`);

    if (oldAssignments.length === 0) {
      console.log("No old assignments found. Exiting.");
      process.exit(0);
    }

    let migratedCount = 0;

    for (const assignment of oldAssignments) {
      // Bỏ qua nếu đã được migrate (có topicId)
      if (assignment.topicId) {
        continue;
      }

      console.log(`Migrating assignment: ${assignment.title} (${assignment._id})`);

      // Assignment cũ dùng classId. Chúng ta sẽ đặt status = ARCHIVED và loại bỏ các trường không tương thích
      // Hoặc lưu lại bản backup cũ. Ở đây ta thêm cờ isLegacy = true và status = ARCHIVED
      await assignmentsCollection.updateOne(
        { _id: assignment._id },
        {
          $set: {
            status: "ARCHIVED",
            isLegacy: true,
            // TopicId tạm để không vỡ Schema mới, ta sẽ dùng 1 ID rác hoặc tìm Topic đầu tiên
          }
        }
      );

      migratedCount++;
    }

    // Xử lý cả collection Submissions cũ
    const submissionsCollection = db.collection("submissions");
    const oldSubmissions = await submissionsCollection.find({}).toArray();
    
    if (oldSubmissions.length > 0) {
       console.log(`Found ${oldSubmissions.length} old submissions. Will archive them.`);
       for (const sub of oldSubmissions) {
          await submissionsCollection.updateOne(
             { _id: sub._id },
             { $set: { status: "ARCHIVED", isLegacy: true } }
          );
       }
    }

    console.log(`Migration completed successfully. Migrated ${migratedCount} assignments.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateAssignments();
