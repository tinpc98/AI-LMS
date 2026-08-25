import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // 1. Reset all Expired users to Active (as they were wrongly expired)
    const updateUsersResult = await db.collection("users").updateMany(
      { status: "Expired" },
      { $set: { status: "Active" } }
    );
    console.log(`✅ Reset ${updateUsersResult.modifiedCount} Expired users to Active status`);

    // 2. Read all classes to find legacy Class.students and convert to ClassEnrollment
    const classes = await db.collection("classes").find({}).toArray();
    let enrollmentsCreated = 0;
    
    // Create an enrollment record for each student in the legacy array
    for (const cls of classes) {
      if (cls.students && Array.isArray(cls.students) && cls.students.length > 0) {
        const enrollments = cls.students.map(s => ({
          studentId: s.studentId || s, // handle object { studentId: ... } or string
          classId: cls._id,
          status: "ACTIVE",
          enrollmentId: new mongoose.Types.ObjectId(), // mock enrollmentId as we don't have course enrollments
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // check if they already exist
        for (const enr of enrollments) {
          const exists = await db.collection("classenrollments").findOne({
            studentId: enr.studentId,
            classId: enr.classId
          });
          if (!exists) {
            await db.collection("classenrollments").insertOne(enr);
            enrollmentsCreated++;
          }
        }
        
        // Update activeCount to match real enrollment
        const currentActive = await db.collection("classenrollments").countDocuments({
          classId: cls._id,
          status: "ACTIVE"
        });
        
        await db.collection("classes").updateOne(
          { _id: cls._id },
          { $set: { activeCount: currentActive } }
        );
      }
    }
    console.log(`✅ Created ${enrollmentsCreated} missing ClassEnrollment records`);
    console.log("🎉 Database Repair Complete!");

  } catch (error) {
    console.error("❌ Error running script:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
