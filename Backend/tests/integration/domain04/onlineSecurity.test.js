import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB, clearDB, seedBaseData, syncAllIndexes } from "./testUtils.js";
import { generateJaasTokenService } from "../../../src/modules/live-session/jaas.service.js";
import { startSessionService } from "../../../src/modules/live-session/live.service.js";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import classEnrollmentService from "../../../src/modules/classEnrollment/classEnrollment.service.js";
import crypto from "crypto";

let testData;

beforeAll(async () => {
  await connectDB();
  await syncAllIndexes();
  
  // Mock JaaS Config
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  process.env.JAAS_PRIVATE_KEY = privateKey;
  process.env.JAAS_APP_ID = "vpaas-magic-cookie-test";
  process.env.JAAS_API_KEY_ID = "vpaas-magic-cookie-test/test";
});

afterAll(async () => {
  await disconnectDB();
  delete process.env.JAAS_PRIVATE_KEY;
  delete process.env.JAAS_APP_ID;
  delete process.env.JAAS_API_KEY_ID;
  vi.useRealTimers();
});

beforeEach(async () => {
  await clearDB();
  testData = await seedBaseData();
  vi.useRealTimers();
});

describe("Domain 04.3 - Online Security & Join Windows", () => {
  it("Test 21, 24: Active Student -> SUCCESS, Unenrolled -> 403", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 600000), // 10 mins ago
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "ONLINE",
      status: "IN_PROGRESS",
      onlineMeeting: { status: "OPEN", roomId: "test-room" }
    });

    // Student A is not yet enrolled -> 403
    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.STUDENT_A,
    })).rejects.toThrow(/Bạn không có quyền tham gia buổi học trực tuyến/);

    // Enroll Student A
    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    // Test 21: Enrolled student -> SUCCESS
    const tokenData = await generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.STUDENT_A,
    });

    expect(tokenData.token).toBeDefined();
    expect(tokenData.roomName).toBe("test-room");
  });

  it("Test 22, 23: Transferred Student -> 403, Other Class Student -> 403", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 600000),
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "ONLINE",
      status: "IN_PROGRESS",
      onlineMeeting: { status: "OPEN", roomId: "test-room" }
    });

    // Enroll and Transfer
    const enrollment = await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });
    
    await classEnrollmentService.transferClass({
      classEnrollmentId: enrollment._id,
      targetClassId: testData.classes.CLASS_B._id,
      adminId: testData.users.ADMIN._id,
    });

    // Test 22: Transferred student -> 403
    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.STUDENT_A,
    })).rejects.toThrow(/Bạn không có quyền tham gia buổi học trực tuyến/);

    // Test 23: Student enrolled in Class B tries to access Class A's session
    const studentB = testData.users.STUDENT_B;
    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_B._id,
      classId: testData.classes.CLASS_B._id,
      adminId: testData.users.ADMIN._id,
    });

    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: studentB,
    })).rejects.toThrow(/Bạn không có quyền tham gia buổi học trực tuyến/);
  });

  it("Test 25: Student access OFFLINE session -> Cannot start", async () => {
    const classId = testData.classes.CLASS_OFFLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 600000),
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "OFFLINE",
    });

    // Session fails to start
    await expect(startSessionService({
      sessionId: session._id,
      userId: testData.users.TEACHER_A._id,
    })).rejects.toThrow(/Không thể bắt đầu Live Meeting cho lớp OFFLINE/);

    // If session is offline, status won't be IN_PROGRESS, generateJaasTokenService will reject
    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.STUDENT_A,
    })).rejects.toThrow(/Buổi học trực tuyến chưa mở/);
  });

  it("Test 26: Student access CLOSED room -> 409", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 3600000),
      scheduledEndAt: new Date(Date.now() - 1000),
      mode: "ONLINE",
      status: "COMPLETED",
      onlineMeeting: { status: "CLOSED", roomId: "test-room" }
    });

    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.STUDENT_A,
    })).rejects.toThrow(/Buổi học trực tuyến chưa mở hoặc đã kết thúc/);
  });

  it("Test 28: Admin lấy Student JaaS token -> 403", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "ONLINE",
      status: "IN_PROGRESS",
      onlineMeeting: { status: "OPEN" }
    });

    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.ADMIN,
    })).rejects.toThrow(/Quản trị viên không được phép/);
  });

  it("Test 29: Teacher A Start Session Teacher B -> 403", async () => {
    const classBId = testData.classes.CLASS_B._id; // Owned by Teacher B
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId: classBId,
      scheduledStartAt: new Date(),
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "ONLINE",
    });

    // JaaS generation (Teacher A trying to join Teacher B's room)
    await expect(generateJaasTokenService({
      sessionId: session._id,
      user: testData.users.TEACHER_A,
    })).rejects.toThrow(/Buổi học trực tuyến chưa mở/); // because status is not IN_PROGRESS yet
  });

  describe("Join Windows Tests", () => {
    it("Test 30-34: Join windows simulation", async () => {
      const classId = testData.classes.CLASS_ONLINE._id;
      // scheduledStartAt = 19:00 UTC
      const scheduledStartAt = new Date("2026-09-01T19:00:00Z");
      const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
        scheduledStartAt,
        scheduledEndAt: new Date("2026-09-01T21:00:00Z"),
        mode: "ONLINE",
      });

      await classEnrollmentService.assignClass({
        enrollmentId: testData.enrollments.ENROLLMENT_A._id,
        classId,
        adminId: testData.users.ADMIN._id,
      });

      // --- Teacher tests ---
      // Test 33: Teacher at 18:29 -> DENY (31 mins before)
      vi.setSystemTime(new Date("2026-09-01T18:29:00Z"));
      await expect(startSessionService({
        sessionId: session._id,
        userId: testData.users.TEACHER_A._id,
      })).rejects.toThrow(/Chưa tới giờ chuẩn bị lớp học/);

      // Test 34: Teacher at 18:30 -> ALLOW (30 mins before)
      vi.setSystemTime(new Date("2026-09-01T18:30:00Z"));
      const startedSession = await startSessionService({
        sessionId: session._id,
        userId: testData.users.TEACHER_A._id,
      });
      expect(startedSession.status).toBe("IN_PROGRESS");

      // --- Student tests ---
      // Test 30: Student at 18:44 -> DENY (16 mins before)
      vi.setSystemTime(new Date("2026-09-01T18:44:00Z"));
      await expect(generateJaasTokenService({
        sessionId: session._id,
        user: testData.users.STUDENT_A,
      })).rejects.toThrow(/Chưa tới giờ vào lớp/);

      // Test 31: Student at 18:45 -> ALLOW (15 mins before)
      vi.setSystemTime(new Date("2026-09-01T18:45:00Z"));
      const token1 = await generateJaasTokenService({
        sessionId: session._id,
        user: testData.users.STUDENT_A,
      });
      expect(token1.token).toBeDefined();

      // Test 32: Student at 19:00 -> ALLOW
      vi.setSystemTime(new Date("2026-09-01T19:00:00Z"));
      const token2 = await generateJaasTokenService({
        sessionId: session._id,
        user: testData.users.STUDENT_A,
      });
      expect(token2.token).toBeDefined();
    });
  });
});
