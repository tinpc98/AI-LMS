import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB, clearDB, seedBaseData, syncAllIndexes } from "./testUtils.js";
import classEnrollmentService from "../../../src/modules/classEnrollment/classEnrollment.service.js";
import ClassEnrollment from "../../../src/modules/classEnrollment/classEnrollment.model.js";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import Attendance from "../../../src/modules/attendance/attendance.model.js";
import { Class } from "#modules/class";

let testData;

beforeAll(async () => {
  await connectDB();
  await syncAllIndexes();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
  testData = await seedBaseData();
});

describe("Domain 04.2 - ClassEnrollment", () => {
  it("Test 06: Add Student vào Class -> Enrollment = ACTIVE, Attendance future được tạo", async () => {
    // We need to create future sessions first to verify Attendance gets created
    const classId = testData.classes.CLASS_ONLINE._id;
    await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() + 86400000), // tomorrow
      scheduledEndAt: new Date(Date.now() + 86400000 + 7200000),
      mode: "ONLINE"
    });

    const result = await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    expect(result.status).toBe("ACTIVE");
    expect(result.studentId.toString()).toBe(testData.users.STUDENT_A._id.toString());

    // Verify Attendance DRAFT created
    const attendance = await Attendance.findOne({ classId, studentId: testData.users.STUDENT_A._id });
    expect(attendance).toBeDefined();
    expect(attendance.status).toBe("DRAFT");
  });

  it("Test 07: Một enrollment không thể có hai ACTIVE Class", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    
    // Assign to first class
    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    // Reset Enrollment status to APPROVED so it passes the first check and hits the db constraint
    await mongoose.connection.collection("enrollments").updateOne(
      { _id: testData.enrollments.ENROLLMENT_A._id },
      { $set: { status: "APPROVED" } }
    );

    // Try assigning to same class again
    await expect(classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    })).rejects.toThrow(/Học sinh này đã có lớp học ACTIVE cho Enrollment này|E11000 duplicate key error/);
  });

  it("Test 08: Capacity (atomic)", async () => {
    // Set capacity to 1
    const classId = testData.classes.CLASS_ONLINE._id;
    await Class.findByIdAndUpdate(classId, { capacity: 1, activeCount: 0, status: "OPEN" });

    // Two users try to assign at the same time
    const results = await Promise.allSettled([
      classEnrollmentService.assignClass({
        enrollmentId: testData.enrollments.ENROLLMENT_A._id,
        classId,
        adminId: testData.users.ADMIN._id,
      }),
      classEnrollmentService.assignClass({
        enrollmentId: testData.enrollments.ENROLLMENT_B._id,
        classId,
        adminId: testData.users.ADMIN._id,
      })
    ]);

    const successes = results.filter(r => r.status === "fulfilled");
    const errors = results.filter(r => r.status === "rejected");

    expect(successes.length).toBe(1);
    expect(errors.length).toBe(1);
    expect(errors[0].reason.message).toMatch(/Lớp học đã đủ sĩ số|concurrency/);
  });

  it("Test 09, 10, 11, 41, 42: Transfer Student", async () => {
    const oldClassId = testData.classes.CLASS_ONLINE._id;
    const newClassId = testData.classes.CLASS_B._id;

    // Create old session (in the past)
    const oldSession = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId: oldClassId,
      scheduledStartAt: new Date(Date.now() - 86400000), // yesterday
      scheduledEndAt: new Date(Date.now() - 86400000 + 7200000),
      mode: "ONLINE",
      status: "COMPLETED"
    });

    // Create new session (future)
    const newSession = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId: newClassId,
      scheduledStartAt: new Date(Date.now() + 86400000), // tomorrow
      scheduledEndAt: new Date(Date.now() + 86400000 + 7200000),
      mode: "ONLINE"
    });

    // Enroll in old class
    const firstEnrollment = await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId: oldClassId,
      adminId: testData.users.ADMIN._id,
    });

    // Create attendance for old session manually (since assignClass only creates future)
    await Attendance.create({
      sessionId: oldSession._id,
      classId: oldClassId,
      studentId: testData.users.STUDENT_A._id,
      status: "PRESENT" // Test 10: Attendance cũ không bị xóa
    });

    // Transfer class
    const transferResult = await classEnrollmentService.transferClass({
      classEnrollmentId: firstEnrollment._id,
      targetClassId: newClassId,
      adminId: testData.users.ADMIN._id,
    });

    // Test 09: Transfer status check
    const oldCE = await ClassEnrollment.findById(firstEnrollment._id);
    expect(oldCE.status).toBe("TRANSFERRED");
    expect(transferResult.status).toBe("ACTIVE");

    // Test 10 & 41: Old attendance still exists and retains sessionId
    const oldAtt = await Attendance.findOne({ sessionId: oldSession._id, studentId: testData.users.STUDENT_A._id });
    expect(oldAtt).toBeDefined();
    expect(oldAtt.status).toBe("PRESENT");
    expect(oldAtt.classId.toString()).toBe(oldClassId.toString());

    // Test 42: Old session still exists
    const checkOldSession = await ClassSession.findById(oldSession._id);
    expect(checkOldSession).toBeDefined();

    // Test 11: Transfer tạo future Attendance ở Class mới
    const newAtt = await Attendance.findOne({ sessionId: newSession._id, studentId: testData.users.STUDENT_A._id });
    expect(newAtt).toBeDefined();
    expect(newAtt.status).toBe("DRAFT");
  });
});
