import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";
import { EventEmitter } from "events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { User } from "./src/modules/auth/index.js";
import { Course } from "./src/modules/course/index.js";
import { Class as ClassModel } from "./src/modules/class/index.js";
import { ClassEnrollment } from "./src/modules/classEnrollment/index.js";
import Announcement from "./src/modules/announcement/announcement.model.js";
import Notification from "./src/modules/notification/notification.model.js";
import notificationService from "./src/modules/notification/notification.service.js";

// Mock Socket.io
class MockSocketIO extends EventEmitter {
  constructor() {
    super();
    this.emittedEvents = [];
  }
  to(room) {
    return {
      emit: (event, data) => {
        this.emittedEvents.push({ room, event, data });
      },
    };
  }
}

const runTests = async () => {
  console.log("=== PHASE 2H NOTIFICATION E2E VERIFICATION ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const io = new MockSocketIO();

  try {
    // SETUP: Create Admin, Teacher, Students, Course, Class, Enrollment
    const admin = await User.findOneAndUpdate(
      { email: "e2e_admin_2h@example.com" },
      {
        fullName: "Admin 2H",
        password: "HashPassword123!",
        role: "Admin",
        status: "Active",
      },
      { upsert: true, new: true }
    );

    const teacher = await User.findOneAndUpdate(
      { email: "e2e_teacher_2h@example.com" },
      {
        fullName: "Teacher 2H",
        password: "HashPassword123!",
        role: "Teacher",
        status: "Active",
      },
      { upsert: true, new: true }
    );

    const studentEnrolled = await User.findOneAndUpdate(
      { email: "e2e_student1_2h@example.com" },
      {
        fullName: "Student Enrolled 2H",
        password: "HashPassword123!",
        role: "Student",
        status: "Active",
      },
      { upsert: true, new: true }
    );

    const studentNotEnrolled = await User.findOneAndUpdate(
      { email: "e2e_student2_2h@example.com" },
      {
        fullName: "Student Not Enrolled 2H",
        password: "HashPassword123!",
        role: "Student",
        status: "Active",
      },
      { upsert: true, new: true }
    );

    const course = await Course.findOneAndUpdate(
      { code: "E2E_COURSE_2H" },
      {
        name: "E2E Course 2H",
        level: "FOUNDATION",
        duration: 12,
        tuitionFee: 1000,
        status: "Active",
      },
      { upsert: true, new: true }
    );

    const classInfo = await ClassModel.findOneAndUpdate(
      { code: "E2E_CLASS_2H" },
      {
        name: "E2E Class 2H",
        courseId: course._id,
        teacherId: teacher._id,
        level: "FOUNDATION",
        capacity: 10,
        status: "OPEN",
      },
      { upsert: true, new: true }
    );

    // Explicitly create an active enrollment using ClassEnrollment model
    await ClassEnrollment.findOneAndUpdate(
      { studentId: studentEnrolled._id, classId: classInfo._id },
      {
        enrollmentId: new mongoose.Types.ObjectId(),
        status: "ACTIVE",
        createdBy: admin._id,
      },
      { upsert: true, new: true }
    );

    // Clear previous notifications for this test
    await Notification.deleteMany({
      recipientId: { $in: [studentEnrolled._id, studentNotEnrolled._id] },
    });

    console.log("Running TEST 1: Class Scope Notification");
    const classAnnouncement = await Announcement.create({
      title: "Class Test Announcement",
      content: "Content",
      createdBy: teacher._id,
      scope: "Class",
      classId: classInfo._id,
    });

    await notificationService.notifyClassAnnouncementCreated({
      announcement: classAnnouncement,
      classInfo: classInfo,
      teacherInfo: teacher,
      io: io,
    });

    // Verify Notification Persistence
    const classNotifsEnrolled = await Notification.find({
      recipientId: studentEnrolled._id,
      entityId: classAnnouncement._id,
    });
    assert.strictEqual(classNotifsEnrolled.length, 1, "Enrolled student should receive 1 class notification");

    const classNotifsUnenrolled = await Notification.find({
      recipientId: studentNotEnrolled._id,
      entityId: classAnnouncement._id,
    });
    assert.strictEqual(classNotifsUnenrolled.length, 0, "Unenrolled student should NOT receive class notification");

    // Verify Socket Emit
    const classSocketEvent = io.emittedEvents.find(
      (e) => e.room === `user:${studentEnrolled._id}` && e.event === "notification:new"
    );
    assert.ok(classSocketEvent, "Socket event should be emitted to enrolled student room for class announcement");
    console.log("TEST 1 PASSED");

    // Clear emitted events
    io.emittedEvents = [];

    console.log("Running TEST 2: Course Scope Notification");
    const courseAnnouncement = await Announcement.create({
      title: "Course Test Announcement",
      content: "Content",
      createdBy: admin._id,
      scope: "Course",
      courseId: course._id,
    });

    await notificationService.notifyCourseAnnouncementCreated({
      announcement: courseAnnouncement,
      courseInfo: course,
      adminInfo: admin,
      io: io,
    });

    // Verify Persistence
    const courseNotifsEnrolled = await Notification.find({
      recipientId: studentEnrolled._id,
      entityId: courseAnnouncement._id,
    });
    assert.strictEqual(courseNotifsEnrolled.length, 1, "Enrolled student should receive 1 course notification");

    const courseNotifsUnenrolled = await Notification.find({
      recipientId: studentNotEnrolled._id,
      entityId: courseAnnouncement._id,
    });
    assert.strictEqual(courseNotifsUnenrolled.length, 0, "Unenrolled student should NOT receive course notification");

    // Verify Socket Emit
    const courseSocketEvent = io.emittedEvents.find(
      (e) => e.room === `user:${studentEnrolled._id}` && e.event === "notification:new"
    );
    assert.ok(courseSocketEvent, "Socket event should be emitted to enrolled student room for course announcement");
    console.log("TEST 2 PASSED");

    // Clear emitted events
    io.emittedEvents = [];

    console.log("Running TEST 3: System Scope Notification");
    const systemAnnouncement = await Announcement.create({
      title: "System Test Announcement",
      content: "Content",
      createdBy: admin._id,
      scope: "System",
    });

    await notificationService.notifySystemAnnouncementCreated({
      announcement: systemAnnouncement,
      adminInfo: admin,
      io: io,
    });

    // Verify Persistence
    const sysNotifsEnrolled = await Notification.find({
      recipientId: studentEnrolled._id,
      entityId: systemAnnouncement._id,
    });
    assert.strictEqual(sysNotifsEnrolled.length, 1, "Enrolled student should receive 1 system notification");

    const sysNotifsUnenrolled = await Notification.find({
      recipientId: studentNotEnrolled._id,
      entityId: systemAnnouncement._id,
    });
    assert.strictEqual(sysNotifsUnenrolled.length, 1, "Unenrolled student should ALSO receive system notification");
    
    // Verify Socket Emit
    const sysSocketEvent1 = io.emittedEvents.find((e) => e.room === `user:${studentEnrolled._id}`);
    const sysSocketEvent2 = io.emittedEvents.find((e) => e.room === `user:${studentNotEnrolled._id}`);
    assert.ok(sysSocketEvent1, "System socket event emitted to enrolled student");
    assert.ok(sysSocketEvent2, "System socket event emitted to unenrolled student");
    console.log("TEST 3 PASSED");

    console.log("All Phase 2H E2E Tests PASSED successfully!");
    process.exit(0);

  } catch (err) {
    console.error("E2E Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
