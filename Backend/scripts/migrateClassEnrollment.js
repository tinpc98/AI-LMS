import mongoose from "mongoose";
import dotenv from "dotenv";
import Class from "../src/modules/class/class.model.js";
import ClassEnrollment from "../src/modules/classEnrollment/classEnrollment.model.js";
import { Enrollment } from "../src/modules/enrollment/index.js";

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for migration");

    const classes = await Class.find({ students: { $exists: true, $not: { $size: 0 } } }).lean();
    console.log(`Found ${classes.length} classes with legacy students.`);

    for (const cls of classes) {
      console.log(`Migrating class ${cls._id} (${cls.name || cls.className})...`);
      let activeCount = 0;
      for (const student of cls.students) {
        if (student.status !== "Enrolled") continue; // Legacy status

        const studentId = student.studentId;
        
        // Find existing Enrollment for this course and student
        let enrollment = await Enrollment.findOne({ courseId: cls.courseId, studentId }).lean();
        
        if (!enrollment) {
          console.log(`Creating dummy enrollment for student ${studentId} in course ${cls.courseId}`);
          const newEnroll = await Enrollment.create({
            courseId: cls.courseId,
            studentId,
            status: "CLASS_ASSIGNED",
            enrollmentDate: student.joinedAt || new Date(),
            notes: "Migrated from legacy Class.students",
          });
          enrollment = newEnroll;
        } else if (enrollment.status === "APPROVED" || enrollment.status === "CLASS_ASSIGNED") {
          await Enrollment.updateOne({ _id: enrollment._id }, { $set: { status: "CLASS_ASSIGNED" } });
        }

        // Check if ClassEnrollment exists for this enrollmentId
        const ceExists = await ClassEnrollment.findOne({ enrollmentId: enrollment._id, status: "ACTIVE" }).lean();
        if (!ceExists) {
          try {
            await ClassEnrollment.create({
              enrollmentId: enrollment._id,
              classId: cls._id,
              studentId,
              status: "ACTIVE",
              joinedAt: student.joinedAt || new Date(),
              createdBy: cls.teacherId || studentId, // fallback
            });
            activeCount++;
          } catch (e) {
            if (e.code === 11000) {
              console.log(`Student ${studentId} already has an ACTIVE class for enrollment ${enrollment._id}, skipping class ${cls._id}`);
            } else {
              throw e;
            }
          }
        } else {
           if (ceExists.classId.toString() === cls._id.toString()) {
              activeCount++;
           } else {
              console.log(`Student ${studentId} already has an ACTIVE class ${ceExists.classId} for enrollment ${enrollment._id}, skipping class ${cls._id}`);
           }
        }
      }

      // Update class activeCount and clean up students array if needed
      // (The prompt says: "Không xóa students[] ngay nếu hệ thống cũ còn dependency", 
      // so we just update activeCount)
      await Class.updateOne(
        { _id: cls._id },
        { $set: { activeCount: activeCount } }
      );
      
      console.log(`Class ${cls._id} migrated. activeCount: ${activeCount}`);
    }

    console.log("Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateData();
