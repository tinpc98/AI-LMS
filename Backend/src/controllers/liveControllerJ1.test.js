import mongoose from "mongoose";
import dotenv from "dotenv";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import { createLiveSession, getActiveLiveSession, endLiveSession } from "./live.controller.js";
import { generateLiveSessionRoomName } from "../utils/liveSessionHelper.js";

dotenv.config();

/**
 * Integration Tests cho Sprint J1: Multi LiveSession - Unique JaaS Room Name per Session
 */
async function runLiveControllerJ1IntegrationTests() {
  console.log("🧪 Bắt đầu Integration Tests cho Sprint J1 (LiveSession Refactor)...");
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

    const testCourseId = new mongoose.Types.ObjectId();
    const testTeacherId = new mongoose.Types.ObjectId();

    // 1. Tạo Class mới KHÔNG CÓ meetingRoomId
    const testClass = await classModel.create({
      className: "Lớp Test Sprint J1",
      classCode: `TEST-J1-${Date.now()}`,
      courseId: testCourseId,
      teacherId: testTeacherId,
      assignedBy: testTeacherId,
      meetingRoomId: null,
    });

    assert(testClass.meetingRoomId === null, "Class mới tạo có meetingRoomId = null");

    const reqTeacher = {
      user: { _id: testTeacherId, id: testTeacherId.toString(), role: "teacher" },
      body: { classId: testClass._id.toString(), title: "Buổi 1 - Thuật toán" },
      params: {},
      app: { get: () => null },
    };

    // 2. Teacher tạo LiveSession lần 1
    const res1 = createMockRes();
    await createLiveSession(reqTeacher, res1);

    assert(res1.statusCode === 201, "Tạo LiveSession lần 1 trả về HTTP 201 Created");
    const session1 = res1.jsonData?.data;
    assert(session1 && session1.roomName.startsWith("lms_"), "Session 1 có roomName chứa tiền tố lms_");
    assert(session1.sessionNumber === 1, "Session 1 có sessionNumber = 1");
    assert(session1.status === "Live", "Session 1 có status = Live");

    // 3. Kiểm tra GET Active Session 1
    const reqGetActive = { params: { classId: testClass._id.toString() } };
    const resGetActive1 = createMockRes();
    await getActiveLiveSession(reqGetActive, resGetActive1);
    assert(resGetActive1.jsonData?.data?.id === session1.id, "GET active trả về đúng Session 1 đang Live");

    // 4. Double Create request khi đang Live -> Trả HTTP 409 Conflict
    const resDuplicate = createMockRes();
    await createLiveSession(reqTeacher, resDuplicate);
    assert(resDuplicate.statusCode === 409, "Double Create khi đang Live trả về HTTP 409 Conflict");
    assert(resDuplicate.jsonData?.message?.includes("đã có một buổi học"), "Message 409 báo lỗi buổi học đang diễn ra");

    // 5. End Session lần 1
    const reqEnd = {
      user: { _id: testTeacherId, id: testTeacherId.toString() },
      body: { classId: testClass._id.toString() },
      app: { get: () => null },
    };
    const resEnd1 = createMockRes();
    await endLiveSession(reqEnd, resEnd1);

    assert(resEnd1.statusCode === 200, "Kết thúc Session 1 trả về HTTP 200 OK");
    assert(resEnd1.jsonData?.data?.status === "Completed", "Session 1 đã đổi status = Completed");
    assert(Boolean(resEnd1.jsonData?.data?.actualEnd), "Session 1 đã ghi nhận actualEnd timestamp");

    // 6. GET Active khi Session 1 đã Completed -> Trả data null
    const resGetActive2 = createMockRes();
    await getActiveLiveSession(reqGetActive, resGetActive2);
    assert(resGetActive2.jsonData?.data === null, "GET active trả data null sau khi Session 1 đã Completed");

    // 7. Teacher tạo LiveSession lần 2
    const reqTeacherSession2 = {
      ...reqTeacher,
      body: { classId: testClass._id.toString(), title: "Buổi 2 - Cấu trúc dữ liệu" },
    };
    const res2 = createMockRes();
    await createLiveSession(reqTeacherSession2, res2);

    assert(res2.statusCode === 201, "Tạo LiveSession lần 2 trả về HTTP 201 Created");
    const session2 = res2.jsonData?.data;
    assert(session2.sessionNumber === 2, "Session 2 có sessionNumber = 2");
    assert(session2.roomName !== session1.roomName, "Session 2 có roomName KHÁC Session 1");
    assert(session2.roomName.includes(session2.id), "Session 2 roomName chứa sessionId 2");

    // 8. Dọn dẹp test data
    await LiveSession.deleteMany({ classId: testClass._id });
    await classModel.deleteOne({ _id: testClass._id });
    console.log("🧹 Đã dọn dẹp test data thành công.");
  } catch (err) {
    assert(false, `Integration test ném ngoại lệ không mong muốn: ${err.message}`);
    console.error(err);
  }

  console.log(`\n📊 Sprint J1 Integration Test Summary: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runLiveControllerJ1IntegrationTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
