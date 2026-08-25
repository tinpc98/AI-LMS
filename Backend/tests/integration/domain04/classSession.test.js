import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB, clearDB, seedBaseData, syncAllIndexes } from "./testUtils.js";
import classSessionService from "../../../src/modules/classSession/classSession.service.js";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import { startSessionService } from "../../../src/modules/live-session/live.service.js";
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

describe("Domain 04.1 - ClassSession & Generation", () => {
  it("Test 01: Generate sessions thành công", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    // We need to set a schedule for the class first
    await Class.findByIdAndUpdate(classId, {
      schedule: { days: ["Monday"], startTime: "08:00", endTime: "10:00" }
    });

    const result = await classSessionService.generateSessions(classId);
    expect(result.created).toBeGreaterThan(0);

    const count = await ClassSession.countDocuments({ classId });
    expect(count).toBe(result.created);
  });

  it("Test 02: Generate cùng schedule 2 lần không duplicate", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    await Class.findByIdAndUpdate(classId, {
      schedule: { days: ["Monday"], startTime: "08:00", endTime: "10:00" }
    });

    const result1 = await classSessionService.generateSessions(classId);
    const result2 = await classSessionService.generateSessions(classId);

    expect(result1.created).toBeGreaterThan(0);
    expect(result2.created).toBe(0); // second time should generate nothing new
    
    const count = await ClassSession.countDocuments({ classId });
    expect(count).toBe(result1.created);
  });

  it("Test 03: Unique constraint classId + scheduledStartAt", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const startAt = new Date("2026-09-01T08:00:00Z");

    await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: startAt,
      scheduledEndAt: new Date("2026-09-01T10:00:00Z"),
      mode: "ONLINE"
    });

    // Attempting to create duplicate should throw
    await expect(ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: startAt,
      scheduledEndAt: new Date("2026-09-01T12:00:00Z"),
      mode: "ONLINE"
    })).rejects.toThrow(/E11000 duplicate key error/);
  });

  it("Test 04: ONLINE session -> Có thể tạo onlineMeeting khi Teacher Start", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() + 15 * 60000), // 15 mins from now
      scheduledEndAt: new Date(Date.now() + 120 * 60000),
      mode: "ONLINE"
    });

    // Teacher starts session (within 30m window)
    const started = await startSessionService({
      sessionId: session._id,
      userId: testData.users.TEACHER_A._id,
    });

    expect(started.status).toBe("IN_PROGRESS");
    expect(started.onlineMeeting).toBeDefined();
    expect(started.onlineMeeting.status).toBe("OPEN");
  });

  it("Test 05: OFFLINE session -> Không thể Start Online Room", async () => {
    const classId = testData.classes.CLASS_OFFLINE._id;
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() + 15 * 60000),
      scheduledEndAt: new Date(Date.now() + 120 * 60000),
      mode: "OFFLINE"
    });

    // Teacher tries to start session
    await expect(startSessionService({
      sessionId: session._id,
      userId: testData.users.TEACHER_A._id,
    })).rejects.toThrow(/Không thể bắt đầu Live Meeting cho lớp OFFLINE/);
  });

  it("Test 40: Generate Session. Sau đó thay đổi Schedule. Session cũ không thay đổi", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    await Class.findByIdAndUpdate(classId, {
      schedule: { days: ["Monday"], startTime: "08:00", endTime: "10:00" }
    });

    await classSessionService.generateSessions(classId);
    
    // Get a session
    const firstSession = await ClassSession.findOne({ classId });
    expect(firstSession).toBeDefined();
    const oldId = firstSession._id.toString();

    // Change schedule
    await Class.findByIdAndUpdate(classId, {
      schedule: { days: ["Tuesday"], startTime: "10:00", endTime: "12:00" }
    });

    await classSessionService.generateSessions(classId);

    // Old session should still exist
    const oldSessionStillExists = await ClassSession.findById(oldId);
    expect(oldSessionStillExists).toBeDefined();
    expect(oldSessionStillExists.isDeleted).toBe(false);
  });
});
