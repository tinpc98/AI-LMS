import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createServer } from "http";
import Client from "socket.io-client";
import { connectDB, disconnectDB, clearDB, seedBaseData, syncAllIndexes } from "./testUtils.js";
import { checkSocketLiveClassAccess } from "../../../src/modules/live-session/socketLiveAccess.service.js";
import classEnrollmentService from "../../../src/modules/classEnrollment/classEnrollment.service.js";
import Attendance from "../../../src/modules/attendance/attendance.model.js";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import jwt from "jsonwebtoken";

let testData;
let io, serverSocket, clientSocket, port;

beforeAll(async () => {
  await connectDB();
  await syncAllIndexes();

  const httpServer = createServer();
  io = new Server(httpServer);
  
  // Set up socket handler manually for tests
  io.on("connection", (socket) => {
    socket.on("JOIN_CLASS_ROOM", async (payload, ack) => {
      const accessCheck = await checkSocketLiveClassAccess(socket.user, payload.classId);
      if (!accessCheck.allowed) {
        if (ack) ack({ success: false, message: "REJECT" });
        return;
      }
      
      const roomName = `room_class_${payload.classId}`;
      socket.join(roomName);

      // Also simulate liveSessionId assignment from active session (as in real handler)
      const activeSession = await ClassSession.findOne({
        classId: payload.classId,
        status: "IN_PROGRESS",
        isDeleted: false,
      });
      if (activeSession) {
        socket.liveSessionId = activeSession._id;
      }
      
      if (ack) ack({ success: true, roomName });
    });

    socket.on("disconnect", async () => {
      if (socket.liveSessionId && socket.user && socket.user.role === "student") {
        await Attendance.updateOne(
          { sessionId: socket.liveSessionId, studentId: socket.user.id },
          { $set: { "evidence.lastLeaveAt": new Date() } }
        );
      }
    });
  });

  await new Promise((resolve) => {
    httpServer.listen(() => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  io.close();
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
  testData = await seedBaseData();
});

// Helper to create client
const createClientSocket = (user) => {
  return new Promise((resolve) => {
    const socket = Client(`http://localhost:${port}`);
    socket.on("connect", () => {
      // simulate authentication middleware setting socket.user
      io.sockets.sockets.get(socket.id).user = {
        id: user._id.toString(),
        role: user.role.toLowerCase(),
        fullName: user.fullName
      };
      resolve(socket);
    });
  });
};

describe("Domain 04.3 - Socket Security Tests", () => {
  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
      clientSocket = null;
    }
  });

  it("Test 35: Active student connect -> ALLOW", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    clientSocket = await createClientSocket(testData.users.STUDENT_A);
    const response = await new Promise(r => clientSocket.emit("JOIN_CLASS_ROOM", { classId }, r));
    
    expect(response.success).toBe(true);
    expect(response.roomName).toBe(`room_class_${classId}`);
  });

  it("Test 36: Transferred student connect -> REJECT", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
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

    clientSocket = await createClientSocket(testData.users.STUDENT_A);
    const response = await new Promise(r => clientSocket.emit("JOIN_CLASS_ROOM", { classId }, r));
    
    expect(response.success).toBe(false);
    expect(response.message).toBe("REJECT");
  });

  it("Test 37: Student Class A connect vào Session Class B -> REJECT", async () => {
    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId: testData.classes.CLASS_ONLINE._id,
      adminId: testData.users.ADMIN._id,
    });

    clientSocket = await createClientSocket(testData.users.STUDENT_A);
    const classBId = testData.classes.CLASS_B._id;
    const response = await new Promise(r => clientSocket.emit("JOIN_CLASS_ROOM", { classId: classBId }, r));
    
    expect(response.success).toBe(false);
    expect(response.message).toBe("REJECT");
  });

  it("Test 38: Student không enrollment connect -> REJECT", async () => {
    clientSocket = await createClientSocket(testData.users.STUDENT_A); // Not enrolled yet
    const classId = testData.classes.CLASS_ONLINE._id;
    const response = await new Promise(r => clientSocket.emit("JOIN_CLASS_ROOM", { classId }, r));
    
    expect(response.success).toBe(false);
    expect(response.message).toBe("REJECT");
  });

  it("Test 39: Student leave/disconnect -> Attendance.evidence updated, status DRAFT", async () => {
    const classId = testData.classes.CLASS_ONLINE._id;
    
    // Create IN_PROGRESS session
    const session = await ClassSession.create({
      title: 'Test', sessionNumber: 1, teacherId: testData.users.TEACHER_A._id,
      classId,
      scheduledStartAt: new Date(Date.now() - 3600000),
      scheduledEndAt: new Date(Date.now() + 3600000),
      mode: "ONLINE",
      status: "IN_PROGRESS"
    });

    await classEnrollmentService.assignClass({
      enrollmentId: testData.enrollments.ENROLLMENT_A._id,
      classId,
      adminId: testData.users.ADMIN._id,
    });

    // Create DRAFT attendance manually since assignClass only does future
    const att = await Attendance.create({
      sessionId: session._id,
      classId,
      studentId: testData.users.STUDENT_A._id,
      status: "DRAFT"
    });

    clientSocket = await createClientSocket(testData.users.STUDENT_A);
    await new Promise(r => clientSocket.emit("JOIN_CLASS_ROOM", { classId }, r));
    
    // Trigger disconnect
    clientSocket.disconnect();
    
    // Wait for async disconnect handler in server to execute
    await new Promise(r => setTimeout(r, 500));

    const check = await Attendance.findById(att._id);
    expect(check.status).toBe("DRAFT");
    expect(check.evidence.lastLeaveAt).toBeDefined();
    
    clientSocket = null;
  });
});
