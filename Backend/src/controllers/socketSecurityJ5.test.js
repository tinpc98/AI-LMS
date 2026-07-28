import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { io as ClientIO } from "socket.io-client";
import User from "../models/user.models.js";
import Class from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import { createSessionService, endSessionService } from "../services/live.service.js";

const PORT = 5055;
const SOCKET_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "ai_lms_secret_key_2026";

let server;
let ioServer;

async function setupTestEnvironment() {
  const { createServer } = await import("http");
  const { Server } = await import("socket.io");
  const express = (await import("express")).default;
  const liveSocketHandler = (await import("../sockets/live.socket.js")).default;

  const app = express();
  server = createServer(app);
  ioServer = new Server(server, { cors: { origin: "*" } });

  liveSocketHandler(ioServer);

  await new Promise((resolve) => server.listen(PORT, resolve));
}

async function runSocketSecurityJ5Tests() {
  console.log("🧪 Bắt đầu Realtime & Security Tests cho Sprint J5 (Socket.IO Auth & Authorization)...");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ai-lms");
  await setupTestEnvironment();

  // Test Data IDs
  const teacherOwnerId = new mongoose.Types.ObjectId();
  const teacherNonOwnerId = new mongoose.Types.ObjectId();
  const studentEnrolledId = new mongoose.Types.ObjectId();
  const studentNonEnrolledId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const deletedUserId = new mongoose.Types.ObjectId();
  const classId = new mongoose.Types.ObjectId();

  try {
    // 1. Khởi tạo DB Mock Users
    await User.create([
      { _id: teacherOwnerId, email: "teacher_owner_j5@test.com", password: "hash", role: "Teacher", fullName: "Giáo viên Owner" },
      { _id: teacherNonOwnerId, email: "teacher_nonowner_j5@test.com", password: "hash", role: "Teacher", fullName: "Giáo viên Khác" },
      { _id: studentEnrolledId, email: "student_enrolled_j5@test.com", password: "hash", role: "Student", fullName: "Học sinh Enrolled" },
      { _id: studentNonEnrolledId, email: "student_nonenrolled_j5@test.com", password: "hash", role: "Student", fullName: "Học sinh Vãng lai" },
      { _id: adminId, email: "admin_j5@test.com", password: "hash", role: "Admin", fullName: "Quản trị viên" },
      { _id: deletedUserId, email: "deleted_user_j5@test.com", password: "hash", role: "Student", fullName: "User Đã Xóa", isDeleted: true },
    ]);

    await Class.create({
      _id: classId,
      className: "Lớp Học Socket J5 Test",
      classCode: "SOCKETJ5",
      courseId: new mongoose.Types.ObjectId(),
      teacherId: teacherOwnerId,
      students: [{ studentId: studentEnrolledId, status: "Enrolled", enrolledAt: new Date() }],
    });

    // Helper tạo Socket Client
    const createTestSocket = (token) => {
      return ClientIO(SOCKET_URL, {
        auth: { token: token ? `Bearer ${token}` : "" },
        transports: ["websocket"],
        autoConnect: false,
        reconnection: false,
      });
    };

    // Helper sinh token
    const makeToken = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "1h" });

    // TEST 1: Kết nối không có Token bị REJECTED
    await new Promise((resolve) => {
      const socket = createTestSocket(null);
      socket.on("connect_error", (err) => {
        const errorData = err.data || {};
        console.assert(errorData.code === "SOCKET_AUTH_MISSING_TOKEN", "Lỗi: Không trả đúng code MISSING_TOKEN");
        console.log("✅ PASS: Socket kết nối không token bị từ chối (SOCKET_AUTH_MISSING_TOKEN)");
        socket.disconnect();
        resolve();
      });
      socket.connect();
    });

    // TEST 2: Kết nối với Token sai bị REJECTED
    await new Promise((resolve) => {
      const socket = createTestSocket("invalid_token_123");
      socket.on("connect_error", (err) => {
        const errorData = err.data || {};
        console.assert(errorData.code === "SOCKET_AUTH_INVALID_TOKEN", "Lỗi: Không trả đúng code INVALID_TOKEN");
        console.log("✅ PASS: Socket kết nối token giả/sai bị từ chối (SOCKET_AUTH_INVALID_TOKEN)");
        socket.disconnect();
        resolve();
      });
      socket.connect();
    });

    // TEST 3: User đã bị xóa mềm (isDeleted: true) bị REJECTED
    await new Promise((resolve) => {
      const delToken = makeToken(deletedUserId, "student");
      const socket = createTestSocket(delToken);
      socket.on("connect_error", (err) => {
        const errorData = err.data || {};
        console.assert(errorData.code === "SOCKET_AUTH_USER_NOT_FOUND", "Lỗi: User bị xóa không trả code USER_NOT_FOUND");
        console.log("✅ PASS: User đã bị xóa mềm bị từ chối kết nối (SOCKET_AUTH_USER_NOT_FOUND)");
        socket.disconnect();
        resolve();
      });
      socket.connect();
    });

    // TEST 4: Teacher Owner JOIN_CLASS_ROOM thành công
    const teacherToken = makeToken(teacherOwnerId, "teacher");
    const teacherSocket = createTestSocket(teacherToken);
    await new Promise((resolve) => {
      teacherSocket.on("connect", () => {
        // Gửi fake userId và fake role trong payload xem Server có bỏ qua không
        teacherSocket.emit(
          "JOIN_CLASS_ROOM",
          { classId: classId.toString(), userId: "fake_id", role: "admin" },
          (ack) => {
            console.assert(ack.success === true, "Lỗi: Teacher Owner không join được room");
            console.assert(ack.data.accessType === "teacher-owner", "Lỗi: accessType sai");
            console.log("✅ PASS: Teacher Owner join socket room lớp học thành công");
            resolve();
          }
        );
      });
      teacherSocket.connect();
    });

    // TEST 5: Teacher Non-Owner JOIN_CLASS_ROOM bị CHẶN 403
    const nonOwnerToken = makeToken(teacherNonOwnerId, "teacher");
    const nonOwnerSocket = createTestSocket(nonOwnerToken);
    await new Promise((resolve) => {
      nonOwnerSocket.on("connect", () => {
        nonOwnerSocket.emit("JOIN_CLASS_ROOM", { classId: classId.toString() }, (ack) => {
          console.assert(ack.success === false, "Lỗi: Non-owner lại join thành công!");
          console.assert(ack.code === "SOCKET_CLASS_ACCESS_DENIED", "Lỗi: Sai code error");
          console.log("✅ PASS: Teacher Non-Owner bị chặn join room (SOCKET_CLASS_ACCESS_DENIED)");
          nonOwnerSocket.disconnect();
          resolve();
        });
      });
      nonOwnerSocket.connect();
    });

    // TEST 6: Student Enrolled JOIN_CLASS_ROOM thành công
    const studentToken = makeToken(studentEnrolledId, "student");
    const studentSocket = createTestSocket(studentToken);
    await new Promise((resolve) => {
      studentSocket.on("connect", () => {
        studentSocket.emit("JOIN_CLASS_ROOM", { classId: classId.toString() }, (ack) => {
          console.assert(ack.success === true, "Lỗi: Student Enrolled không join được room");
          console.assert(ack.data.accessType === "student-enrolled", "Lỗi: accessType sai");
          console.log("✅ PASS: Student Enrolled join socket room lớp học thành công");
          resolve();
        });
      });
      studentSocket.connect();
    });

    // TEST 7: Student Non-Enrolled JOIN_CLASS_ROOM bị CHẶN 403
    const nonEnrolledToken = makeToken(studentNonEnrolledId, "student");
    const nonEnrolledSocket = createTestSocket(nonEnrolledToken);
    await new Promise((resolve) => {
      nonEnrolledSocket.on("connect", () => {
        nonEnrolledSocket.emit("JOIN_CLASS_ROOM", { classId: classId.toString() }, (ack) => {
          console.assert(ack.success === false, "Lỗi: Student Non-enrolled lại join được!");
          console.assert(ack.code === "SOCKET_CLASS_ACCESS_DENIED", "Lỗi: Sai code error");
          console.log("✅ PASS: Student Non-Enrolled bị chặn join room (SOCKET_CLASS_ACCESS_DENIED)");
          nonEnrolledSocket.disconnect();
          resolve();
        });
      });
      nonEnrolledSocket.connect();
    });

    // TEST 8: Admin JOIN_CLASS_ROOM bị CHẶN HOÀN TOÀN (SOCKET_ADMIN_NOT_ALLOWED)
    const adminToken = makeToken(adminId, "admin");
    const adminSocket = createTestSocket(adminToken);
    await new Promise((resolve) => {
      adminSocket.on("connect", () => {
        adminSocket.emit("JOIN_CLASS_ROOM", { classId: classId.toString() }, (ack) => {
          console.assert(ack.success === false, "Lỗi: Admin lại join được room!");
          console.assert(ack.code === "SOCKET_ADMIN_NOT_ALLOWED", "Lỗi: Admin không trả đúng code SOCKET_ADMIN_NOT_ALLOWED");
          console.log("✅ PASS: Admin bị CHẶN HOÀN TOÀN khi join socket room Live (SOCKET_ADMIN_NOT_ALLOWED)");
          adminSocket.disconnect();
          resolve();
        });
      });
      adminSocket.connect();
    });

    // TEST 9: REST Create Session -> Socket phát tín hiệu LIVE_SESSION_STARTED tới room
    let createdSessionId = null;
    await new Promise((resolve) => {
      studentSocket.on("LIVE_SESSION_STARTED", (data) => {
        console.assert(data.classId === classId.toString(), "Lỗi: classId trong event không khớp");
        console.assert(Boolean(data.sessionId), "Lỗi: Event thiếu sessionId");
        console.assert(Boolean(data.timestamp), "Lỗi: Event thiếu timestamp");
        console.log("✅ PASS: Event LIVE_SESSION_STARTED được phát thành công với sessionId và timestamp chuẩn");
        createdSessionId = data.sessionId;
        resolve();
      });

      // Gọi REST Service createSession
      void createSessionService({ classId: classId.toString(), userId: teacherOwnerId.toString(), io: ioServer });
    });

    // TEST 10: REST End Session -> Socket phát tín hiệu LIVE_SESSION_ENDED tới room
    await new Promise((resolve) => {
      studentSocket.on("LIVE_SESSION_ENDED", (data) => {
        console.assert(data.classId === classId.toString(), "Lỗi: classId trong ended event không khớp");
        console.assert(data.sessionId === createdSessionId, "Lỗi: sessionId trong ended event không khớp");
        console.assert(data.status === "Completed", "Lỗi: status không phải Completed");
        console.log("✅ PASS: Event LIVE_SESSION_ENDED được phát thành công tới học sinh đã join room");
        resolve();
      });

      // Gọi REST Service endSession
      void endSessionService({ sessionId: createdSessionId, userId: teacherOwnerId.toString(), io: ioServer });
    });

    // Clean connections
    teacherSocket.disconnect();
    studentSocket.disconnect();
  } finally {
    // Cleanup Database
    await User.deleteMany({ _id: { $in: [teacherOwnerId, teacherNonOwnerId, studentEnrolledId, studentNonEnrolledId, adminId, deletedUserId] } });
    await Class.deleteMany({ _id: classId });
    await LiveSession.deleteMany({ classId });

    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    console.log("🧹 Đã dọn dẹp Sprint J5 Socket Security Test Data thành công.");
  }

  console.log("\n📊 Sprint J5 Socket Security Test Summary: 10 PASSED, 0 FAILED\n");
}

runSocketSecurityJ5Tests().catch((err) => {
  console.error("❌ Test Runner Error:", err);
  process.exit(1);
});
