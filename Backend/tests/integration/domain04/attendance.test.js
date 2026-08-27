import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB, clearDB, seedBaseData, syncAllIndexes } from "./testUtils.js";
import attendanceService from "../../../src/modules/attendance/attendance.service.js";
import Attendance from "../../../src/modules/attendance/attendance.model.js";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import ClassEnrollment from "../../../src/modules/classEnrollment/classEnrollment.model.js";

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

describe("Domain 04 - Attendance & Auto-Present Regression", () => {
  it("Test 12: Attendance mới -> status === DRAFT", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 7200000),
      mode: "ONLINE",
    });

    const att = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT",
    });

    expect(att.status).toBe("DRAFT");
  });

  it("Test 14, 15, 16: Teacher mark PRESENT, ABSENT, LATE", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 3600000), // 1 hour ago
      scheduledEndAt: new Date(Date.now() - 1000), // just ended
      mode: "ONLINE",
    });

    await ClassEnrollment.create({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      studentId: testData.users.STUDENT_A._id,
      classId,
      status: "ACTIVE",
      createdBy: testData.users.ADMIN._id,
    });

    const att = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT",
    });

    await attendanceService.markAttendance({
      sessionId: session._id,
      classId,
      teacherId: testData.users.TEACHER_A._id,
      records: [{ studentId: testData.users.STUDENT_A._id, status: "PRESENT" }],
    });

    const check1 = await Attendance.findById(att._id);
    expect(check1.status).toBe("PRESENT");

    await attendanceService.markAttendance({
      sessionId: session._id,
      classId,
      teacherId: testData.users.TEACHER_A._id,
      records: [{ studentId: testData.users.STUDENT_A._id, status: "ABSENT" }],
    });

    const check2 = await Attendance.findById(att._id);
    expect(check2.status).toBe("ABSENT");

    await attendanceService.markAttendance({
      sessionId: session._id,
      classId,
      teacherId: testData.users.TEACHER_A._id,
      records: [{ studentId: testData.users.STUDENT_A._id, status: "LATE" }],
    });

    const check3 = await Attendance.findById(att._id);
    expect(check3.status).toBe("LATE");
  });

  it("Test 17: Teacher confirm sau 24h -> request rejected", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 48 * 3600000), // 48 hours ago
      scheduledEndAt: new Date(Date.now() - 46 * 3600000), // ended 46 hours ago
      mode: "ONLINE",
    });

    await expect(
      attendanceService.confirmAttendance({
        sessionId: session._id,
        teacherId: testData.users.TEACHER_A._id,
      })
    ).rejects.toThrow(/Đã quá 24h kể từ khi buổi học kết thúc/);
  });

  it("Test 18: Teacher confirm trong 24h -> success", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      scheduledEndAt: new Date(Date.now() - 3600000), // ended 1 hour ago
      mode: "ONLINE",
    });

    await ClassEnrollment.create({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      studentId: testData.users.STUDENT_A._id,
      classId,
      status: "ACTIVE",
      createdBy: testData.users.ADMIN._id,
    });

    const att = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT",
    });

    await attendanceService.confirmAttendance({
      sessionId: session._id,
      teacherId: testData.users.TEACHER_A._id,
    });

    // DRAFT -> ABSENT
    const check = await Attendance.findById(att._id);
    expect(check.status).toBe("ABSENT");
  });

  it("Test 19, 20 & Auto-Present: Student JOIN/LEAVE -> Attendance remains DRAFT, evidence updated", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 7200000),
      mode: "ONLINE",
    });

    const att = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT",
    });

    // TÍNH NĂNG MỚI (mục 7): evidence giờ lưu evidence.sessions[] (khoảng join-leave thô) thay
    // vì các field rời rạc firstJoinAt/lastLeaveAt/onlineDurationSeconds — xem attendance.model.js
    // và live.socket.js. Mô phỏng JOIN như socket thật sẽ làm: $push khoảng mới, leaveAt=null.
    const joinTime = new Date();
    await Attendance.updateOne(
      { _id: att._id },
      { $push: { "evidence.sessions": { joinAt: joinTime, leaveAt: null } } }
    );

    const checkJoin = await Attendance.findById(att._id);
    expect(checkJoin.status).toBe("DRAFT"); // TEST FAIL IF PRESENT
    expect(checkJoin.evidence.sessions).toHaveLength(1);
    expect(checkJoin.evidence.sessions[0].joinAt).toBeDefined();
    expect(checkJoin.evidence.sessions[0].leaveAt).toBeNull();

    // Simulate LEAVE > 60s — đóng đúng khoảng vừa mở qua arrayFilters (giống closeAttendanceSession).
    const leaveTime = new Date(joinTime.getTime() + 120 * 1000); // 2 mins later
    await Attendance.updateOne(
      { _id: att._id },
      { $set: { "evidence.sessions.$[elem].leaveAt": leaveTime } },
      { arrayFilters: [{ "elem.joinAt": joinTime, "elem.leaveAt": null }] }
    );

    const checkLeave = await Attendance.findById(att._id);
    expect(checkLeave.status).toBe("DRAFT"); // MUST BE DRAFT
    expect(checkLeave.evidence.sessions[0].leaveAt).toBeDefined();
    expect(checkLeave.evidence.sessions[0].leaveAt.getTime()).toBe(leaveTime.getTime());
  });

  it("Attendance Query Regression: getAttendanceByClass uses sessionId", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const sessionDate = new Date();
    const session = await ClassSession.create({
      title: "Test",
      sessionNumber: 1,
      teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: sessionDate,
      scheduledEndAt: new Date(sessionDate.getTime() + 7200000),
      mode: "ONLINE",
    });

    await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT",
    });

    // query with date should successfully fetch by finding the session first
    const dateString = sessionDate.toISOString().split("T")[0];
    const records = await attendanceService.getAttendanceByClass(classId, dateString);
    expect(records.length).toBe(1);
    expect(records[0].sessionId._id.toString()).toBe(session._id.toString());
  });

  it("Attendance Enum Regression: count chính xác", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;

    await Attendance.insertMany([
      {
        sessionId: new mongoose.Types.ObjectId(),
        classId,
        studentId: testData.users.STUDENT_A._id,
        status: "PRESENT",
      },
      {
        sessionId: new mongoose.Types.ObjectId(),
        classId,
        studentId: testData.users.STUDENT_B._id,
        status: "PRESENT",
      },
      {
        sessionId: new mongoose.Types.ObjectId(),
        classId,
        studentId: testData.users.STUDENT_C._id,
        status: "ABSENT",
      },
    ]);

    const stats = await attendanceService.getAttendanceStats(classId);
    expect(stats.present).toBe(2);
    expect(stats.absent).toBe(1);
    expect(stats.late).toBe(0);
  });
});
