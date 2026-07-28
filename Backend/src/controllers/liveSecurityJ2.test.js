import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import { createLiveSession, getActiveLiveSession, endLiveSession } from "./live.controller.js";
import { generateJaasTokenForSession, validateJaasConfig } from "./jaas.controller.js";
import { checkClassTeacherOwnership, checkClassEnrollment } from "../middlewares/liveAuth.middlewares.js";

dotenv.config();

/**
 * Integration & Security Tests cho Sprint J2: RBAC, Teacher Ownership, Student Enrollment & JWT Claims
 */
async function runSprintJ2SecurityTests() {
  console.log("🧪 Bắt đầu Security Integration Tests cho Sprint J2...");
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // 1. Kiểm tra Fail-fast Config Validator
    const isConfigValid = validateJaasConfig();
    assert(isConfigValid === true, "8x8 JaaS Config Validator kiểm tra thành công.");

    // Tạo Mock Users: Teacher Owner, Teacher Non-Owner, Student Enrolled, Student Non-Enrolled
    const teacherOwnerId = new mongoose.Types.ObjectId();
    const teacherNonOwnerId = new mongoose.Types.ObjectId();
    const studentEnrolledId = new mongoose.Types.ObjectId();
    const studentNonEnrolledId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    // Tạo Lớp học Test
    const testClass = await classModel.create({
      className: "Lớp Security Test J2",
      classCode: `SEC-J2-${Date.now()}`,
      courseId,
      teacherId: teacherOwnerId,
      assignedBy: teacherOwnerId,
      meetingRoomId: null,
      students: [
        {
          studentId: studentEnrolledId,
          status: "Enrolled",
          joinedAt: new Date(),
        },
      ],
    });

    const classIdStr = testClass._id.toString();

    // 2. Test Teacher Non-Owner tạo LiveSession -> Bị chặn 403 (checkClassTeacherOwnership)
    const reqNonOwnerCreate = {
      user: { id: teacherNonOwnerId.toString(), _id: teacherNonOwnerId, role: "teacher" },
      body: { classId: classIdStr, title: "Học trộm lớp khác" },
      params: {},
    };
    const resNonOwnerCreate = createMockRes();
    let nextCalled = false;
    await checkClassTeacherOwnership(reqNonOwnerCreate, resNonOwnerCreate, () => { nextCalled = true; });

    assert(!nextCalled && resNonOwnerCreate.statusCode === 403, "Teacher Non-Owner bị chặn 403 khi cố tạo LiveSession");

    // 3. Test Teacher Owner tạo LiveSession -> Pass Ownership MW (201 Created)
    const reqOwnerCreate = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      body: { classId: classIdStr, title: "Buổi 1 - Thuật toán bảo mật" },
      params: {},
      app: { get: () => null },
    };
    const resOwnerMW = createMockRes();
    nextCalled = false;
    await checkClassTeacherOwnership(reqOwnerCreate, resOwnerMW, () => { nextCalled = true; });
    assert(nextCalled, "Teacher Owner pass middleware checkClassTeacherOwnership");

    const resOwnerCreate = createMockRes();
    await createLiveSession(reqOwnerCreate, resOwnerCreate);
    assert(resOwnerCreate.statusCode === 201, "Teacher Owner tạo LiveSession thành công (201 Created)");
    const activeSession = resOwnerCreate.jsonData?.data;
    const sessionIdStr = activeSession.id || activeSession._id.toString();

    // 4. Test Student Non-Enrolled xem Active Session -> Bị chặn 403 (checkClassEnrollment)
    const reqNonEnrolledActive = {
      user: { id: studentNonEnrolledId.toString(), _id: studentNonEnrolledId, role: "student" },
      params: { classId: classIdStr },
    };
    const resNonEnrolledActive = createMockRes();
    nextCalled = false;
    await checkClassEnrollment(reqNonEnrolledActive, resNonEnrolledActive, () => { nextCalled = true; });
    assert(!nextCalled && resNonEnrolledActive.statusCode === 403, "Student Non-Enrolled bị chặn 403 khi xem Active Session");

    // 5. Test Student Enrolled xem Active Session -> Pass Enrollment MW (200 OK)
    const reqEnrolledActive = {
      user: { id: studentEnrolledId.toString(), _id: studentEnrolledId, role: "student" },
      params: { classId: classIdStr },
    };
    const resEnrolledMW = createMockRes();
    nextCalled = false;
    await checkClassEnrollment(reqEnrolledActive, resEnrolledMW, () => { nextCalled = true; });
    assert(nextCalled, "Student Enrolled pass middleware checkClassEnrollment");

    // 6. Test Token Claims: Student Enrolled lấy Token JaaS
    const reqEnrolledToken = {
      user: { id: studentEnrolledId.toString(), _id: studentEnrolledId, role: "student", name: "Sinh viên A" },
      params: { sessionId: sessionIdStr },
      body: {},
      classInfo: testClass,
    };
    const resEnrolledToken = createMockRes();
    await generateJaasTokenForSession(reqEnrolledToken, resEnrolledToken);

    assert(resEnrolledToken.statusCode === 200, "Student Enrolled lấy Token JaaS thành công (200 OK)");
    assert(resEnrolledToken.jsonData?.moderator === false, "Student Enrolled nhận Token với moderator = false");

    // Giải mã JWT Payload để verify claims
    const decodedStudentToken = jwt.decode(resEnrolledToken.jsonData?.token);
    assert(decodedStudentToken.room === activeSession.roomName, `JWT claim room = ${activeSession.roomName} (KHÔNG PHẢI WILDCARD *)`);
    assert(decodedStudentToken.context.user.moderator === false, "JWT Payload context.user.moderator = false");

    // 7. Test Token Claims: Teacher Owner lấy Token JaaS
    const reqOwnerToken = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher", name: "Giáo viên B" },
      params: { sessionId: sessionIdStr },
      body: {},
      classInfo: testClass,
    };
    const resOwnerToken = createMockRes();
    await generateJaasTokenForSession(reqOwnerToken, resOwnerToken);

    assert(resOwnerToken.statusCode === 200, "Teacher Owner lấy Token JaaS thành công (200 OK)");
    assert(resOwnerToken.jsonData?.moderator === true, "Teacher Owner nhận Token với moderator = true");
    const decodedOwnerToken = jwt.decode(resOwnerToken.jsonData?.token);
    assert(decodedOwnerToken.context.user.moderator === true, "JWT Payload context.user.moderator = true cho Teacher Owner");

    // 8. Test Teacher Non-Owner ngắt Session -> Bị chặn 403 (checkClassTeacherOwnership)
    const reqNonOwnerEnd = {
      user: { id: teacherNonOwnerId.toString(), _id: teacherNonOwnerId, role: "teacher" },
      body: { classId: classIdStr },
      params: {},
    };
    const resNonOwnerEnd = createMockRes();
    nextCalled = false;
    await checkClassTeacherOwnership(reqNonOwnerEnd, resNonOwnerEnd, () => { nextCalled = true; });
    assert(!nextCalled && resNonOwnerEnd.statusCode === 403, "Teacher Non-Owner bị chặn 403 khi cố ngắt Session");

    // 9. Teacher Owner kết thúc Session -> Success 200
    const reqOwnerEnd = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      body: { classId: classIdStr },
      params: {},
      app: { get: () => null },
    };
    const resOwnerEnd = createMockRes();
    await endLiveSession(reqOwnerEnd, resOwnerEnd);
    assert(resOwnerEnd.statusCode === 200, "Teacher Owner ngắt Session thành công (200 OK)");

    // 10. Lấy Token cho Session đã Completed -> Bị từ chối 409 Conflict
    const resEndedToken = createMockRes();
    await generateJaasTokenForSession(reqOwnerToken, resEndedToken);
    assert(resEndedToken.statusCode === 409, "Không thể phát hành Token cho Session đã Completed (HTTP 409 Conflict)");

    // 11. Dọn dẹp test data
    await LiveSession.deleteMany({ classId: testClass._id });
    await classModel.deleteOne({ _id: testClass._id });
    console.log("🧹 Đã dọn dẹp Security Test Data thành công.");
  } catch (err) {
    assert(false, `Security Test ném ngoại lệ không mong muốn: ${err.message}`);
    console.error(err);
  }

  console.log(`\n📊 Sprint J2 Security Test Summary: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runSprintJ2SecurityTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
