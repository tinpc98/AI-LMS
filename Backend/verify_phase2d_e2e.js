import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { User } from "./src/modules/auth/index.js";
import { Course } from "./src/modules/course/index.js";
import { Class as ClassModel } from "./src/modules/class/index.js";
import { ClassEnrollment } from "./src/modules/classEnrollment/index.js";
import ClassSession from "./src/modules/classSession/classSession.model.js";
import Attendance from "./src/modules/attendance/attendance.model.js";
import attendanceService from "./src/modules/attendance/attendance.service.js";

// Import controller directly to test IDOR protections
import * as attendanceController from "./src/modules/attendance/attendance.controller.js";

// Mock Express req/res
const mockReq = (user, params = {}, query = {}, body = {}) => ({
  user,
  params,
  query,
  body,
});

const mockRes = () => {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.data = data;
    return this;
  };
  return res;
};

const runTests = async () => {
  console.log("=== PHASE 2D STUDENT ATTENDANCE E2E VERIFICATION ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  try {
    // 1. SETUP DATA
    const admin = await User.findOneAndUpdate(
      { email: "admin_2d@example.com" },
      { fullName: "Admin 2D", role: "Admin", status: "Active" },
      { upsert: true, new: true }
    );

    const teacher = await User.findOneAndUpdate(
      { email: "teacher_2d@example.com" },
      { fullName: "Teacher 2D", role: "Teacher", status: "Active" },
      { upsert: true, new: true }
    );
    
    const rogueTeacher = await User.findOneAndUpdate(
      { email: "rogue_teacher_2d@example.com" },
      { fullName: "Rogue Teacher 2D", role: "Teacher", status: "Active" },
      { upsert: true, new: true }
    );

    const studentEnrolled = await User.findOneAndUpdate(
      { email: "student_enrolled_2d@example.com" },
      { fullName: "Student Enrolled 2D", role: "Student", status: "Active" },
      { upsert: true, new: true }
    );

    const studentLate = await User.findOneAndUpdate(
      { email: "student_late_2d@example.com" },
      { fullName: "Student Late Enrolled 2D", role: "Student", status: "Active" },
      { upsert: true, new: true }
    );

    const studentDropped = await User.findOneAndUpdate(
      { email: "student_dropped_2d@example.com" },
      { fullName: "Student Dropped 2D", role: "Student", status: "Active" },
      { upsert: true, new: true }
    );

    const studentRogue = await User.findOneAndUpdate(
      { email: "rogue_student_2d@example.com" },
      { fullName: "Rogue Student 2D", role: "Student", status: "Active" },
      { upsert: true, new: true }
    );

    const course = await Course.findOneAndUpdate(
      { code: "COURSE_2D" },
      { name: "Course 2D", status: "Active" },
      { upsert: true, new: true }
    );

    const classInfo = await ClassModel.findOneAndUpdate(
      { code: "CLASS_2D" },
      { name: "Class 2D", courseId: course._id, teacherId: teacher._id, status: "OPEN" },
      { upsert: true, new: true }
    );

    // Create Enrollments
    await ClassEnrollment.findOneAndUpdate(
      { studentId: studentEnrolled._id, classId: classInfo._id },
      { status: "ACTIVE", createdBy: admin._id, enrollmentId: new mongoose.Types.ObjectId() },
      { upsert: true, returnDocument: 'after' }
    );

    await ClassEnrollment.findOneAndUpdate(
      { studentId: studentDropped._id, classId: classInfo._id },
      { status: "CANCELLED", createdBy: admin._id, enrollmentId: new mongoose.Types.ObjectId() },
      { upsert: true, returnDocument: 'after' }
    );

    // Create a Session
    const session = await ClassSession.findOneAndUpdate(
      { classId: classInfo._id, title: "Test Session 2D" },
      {
        teacherId: teacher._id,
        sessionNumber: 1,
        scheduledStartAt: new Date(),
        scheduledEndAt: new Date(Date.now() + 3600000), // +1 hr
        status: "SCHEDULED"
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Clear previous attendances
    await Attendance.deleteMany({ classId: classInfo._id });

    // Seed DRAFT attendance for enrolled student (simulate ClassSessionService behavior)
    await Attendance.create({
      sessionId: session._id,
      classId: classInfo._id,
      studentId: studentEnrolled._id,
      status: "DRAFT"
    });

    // NOW enroll the late student (after session generation)
    await ClassEnrollment.findOneAndUpdate(
      { studentId: studentLate._id, classId: classInfo._id },
      { status: "ACTIVE", createdBy: admin._id, enrollmentId: new mongoose.Types.ObjectId() },
      { upsert: true, returnDocument: 'after' }
    );
    // StudentLate has NO DRAFT record!

    console.log("Running TEST 1: Mark Attendance (Validation & Drop Filter)");
    // Teacher tries to mark all 3 students (enrolled, late, dropped)
    const markRecords = [
      { studentId: studentEnrolled._id, status: "PRESENT" },
      { studentId: studentLate._id, status: "LATE" },
      { studentId: studentDropped._id, status: "PRESENT" } // Should be ignored
    ];

    await attendanceService.markAttendance({
      sessionId: session._id,
      classId: classInfo._id,
      records: markRecords,
      teacherId: teacher._id
    });

    const attendances = await Attendance.find({ sessionId: session._id });
    
    const enrolledRecord = attendances.find(a => a.studentId.toString() === studentEnrolled._id.toString());
    assert.ok(enrolledRecord && enrolledRecord.status === "PRESENT", "Enrolled student should be PRESENT");

    const lateRecord = attendances.find(a => a.studentId.toString() === studentLate._id.toString());
    assert.ok(lateRecord && lateRecord.status === "LATE", "Late enrolled student should be LATE");

    const droppedRecord = attendances.find(a => a.studentId.toString() === studentDropped._id.toString());
    assert.ok(!droppedRecord, "Dropped student should NOT have an attendance record");
    
    console.log("TEST 1 PASSED");

    console.log("Running TEST 2: IDOR Protection (Confirm Attendance)");
    // Rogue teacher tries to confirm another teacher's class
    const reqRogueConfirm = mockReq(
      { id: rogueTeacher._id, role: "Teacher" },
      { sessionId: session._id }
    );
    const resRogueConfirm = mockRes();
    await attendanceController.confirmAttendance(reqRogueConfirm, resRogueConfirm);
    
    assert.strictEqual(resRogueConfirm.statusCode, 403, "Rogue teacher should get 403 Forbidden");
    console.log("TEST 2 PASSED");

    console.log("Running TEST 3: Late Enrollee Absent Generation (Confirm Attendance)");
    // Let's delete the late student's record so they have NO record (like they never showed up)
    await Attendance.deleteOne({ studentId: studentLate._id, sessionId: session._id });

    // Teacher confirms the session
    const reqTeacherConfirm = mockReq(
      { id: teacher._id, role: "Teacher" },
      { sessionId: session._id }
    );
    const resTeacherConfirm = mockRes();
    await attendanceController.confirmAttendance(reqTeacherConfirm, resTeacherConfirm);

    assert.ok(resTeacherConfirm.data.success, "Teacher should successfully confirm");

    const finalAttendances = await Attendance.find({ sessionId: session._id });
    const lateRecordFinal = finalAttendances.find(a => a.studentId.toString() === studentLate._id.toString());
    assert.ok(lateRecordFinal && lateRecordFinal.status === "ABSENT", "Late student should be marked ABSENT automatically on confirm");
    console.log("TEST 3 PASSED");

    console.log("Running TEST 4: IDOR Protection (Get Matrix)");
    const reqRogueStudentMatrix = mockReq(
      { id: studentRogue._id, role: "Student" },
      { classId: classInfo._id }
    );
    const resRogueStudentMatrix = mockRes();
    await attendanceController.getAttendanceMatrix(reqRogueStudentMatrix, resRogueStudentMatrix);

    assert.strictEqual(resRogueStudentMatrix.statusCode, 403, "Rogue student should get 403 Forbidden");
    console.log("TEST 4 PASSED");

    console.log("Running TEST 5: Source of Truth (Get Matrix)");
    const reqTeacherMatrix = mockReq(
      { id: teacher._id, role: "Teacher" },
      { classId: classInfo._id }
    );
    const resTeacherMatrix = mockRes();
    await attendanceController.getAttendanceMatrix(reqTeacherMatrix, resTeacherMatrix);

    assert.ok(resTeacherMatrix.data.success, "Teacher matrix should load");
    const matrixStudents = resTeacherMatrix.data.data.students;
    
    assert.strictEqual(matrixStudents.length, 2, "Matrix should only return the 2 ACTIVE students");
    const hasEnrolled = matrixStudents.some(s => s._id.toString() === studentEnrolled._id.toString());
    const hasLate = matrixStudents.some(s => s._id.toString() === studentLate._id.toString());
    const hasDropped = matrixStudents.some(s => s._id.toString() === studentDropped._id.toString());
    
    assert.ok(hasEnrolled, "Matrix has enrolled student");
    assert.ok(hasLate, "Matrix has late student");
    assert.ok(!hasDropped, "Matrix does NOT have dropped student");
    console.log("TEST 5 PASSED");

    console.log("All Phase 2D E2E Tests PASSED successfully!");
    process.exit(0);
  } catch (err) {
    console.error("E2E Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
