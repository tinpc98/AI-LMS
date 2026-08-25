import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cleanupDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/eduspace_thpt";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Cleanup");

    const db = mongoose.connection.db;
    
    // 1. Dọn dẹp Orphan Enrollments
    const enrolls = await db.collection("classenrollments").find().toArray();
    const userIds = enrolls.map(e => e.studentId); // ObjectId
    const users = await db.collection("users").find({ _id: { $in: userIds } }).toArray();
    
    const validUserIds = new Set(users.map(u => u._id.toString()));
    const orphanEnrollmentIds = enrolls
      .filter(e => !validUserIds.has(e.studentId.toString()))
      .map(e => e._id);
      
    if (orphanEnrollmentIds.length > 0) {
      await db.collection("classenrollments").deleteMany({ _id: { $in: orphanEnrollmentIds } });
      console.log(`Deleted ${orphanEnrollmentIds.length} orphan class enrollments.`);
    } else {
      console.log("No orphan enrollments found.");
    }
    
    // 2. Dọn dẹp Duplicate Test Teacher D06
    const testTeachers = await db.collection("users").find({ fullName: "Test Teacher D06" }).toArray();
    if (testTeachers.length > 1) {
      // Keep the first one, delete the rest
      const teachersToDelete = testTeachers.slice(1).map(t => t._id);
      await db.collection("users").deleteMany({ _id: { $in: teachersToDelete } });
      console.log(`Deleted ${teachersToDelete.length} duplicate 'Test Teacher D06' users.`);
    } else {
      console.log("No duplicate test teachers found.");
    }

    console.log("Cleanup finished.");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

cleanupDB();
