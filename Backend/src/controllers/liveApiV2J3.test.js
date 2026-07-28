import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import {
  createLiveSession,
  getActiveLiveSession,
  getLiveSessionDetail,
  getLiveSessionHistory,
  endLiveSession,
} from "./live.controller.js";
import { generateJaasTokenForSession } from "./jaas.controller.js";
import { checkClassTeacherOwnership, checkClassEnrollment } from "../middlewares/liveAuth.middlewares.js";
import { migrateLiveSessionV2 } from "../scripts/migrateLiveSessionV2.js";

dotenv.config();

/**
 * Integration & Security Tests cho Sprint J3: API V2, Admin Blocked & Migration Validation
 */
async function runSprintJ3IntegrationTests() {
  console.log("🧪 Bắt đầu Integration & Authorization Tests cho Sprint J3 (API V2 & Migration)...");
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

    const teacherOwnerId = new mongoose.Types.ObjectId();
    const teacherNonOwnerId = new mongoose.Types.ObjectId();
    const studentEnrolledId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();

    // 1. Khởi tạo Lớp học thử nghiệm
    const testClass = await classModel.create({
      className: "Lớp API V2 Sprint J3",
      classCode: `V2-J3-${Date.now()}`,
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

    // 2. TEST MA TRẬN QUYỀN: Admin bị CHẶN HOÀN TOÀN với HTTP 403 & code LIVE_ADMIN_OPERATION_NOT_ALLOWED
    const reqAdminCreate = {
      user: { id: adminId.toString(), _id: adminId, role: "admin" },
      body: { classId: classIdStr, title: "Admin thử tạo" },
      params: {},
    };
    const resAdminCreate = createMockRes();
    let nextCalled = false;
    await checkClassTeacherOwnership(reqAdminCreate, resAdminCreate, () => { nextCalled = true; });

    assert(
      !nextCalled &&
        resAdminCreate.statusCode === 403 &&
        resAdminCreate.jsonData?.code === "LIVE_ADMIN_OPERATION_NOT_ALLOWED",
      "Admin bị CHẶN HOÀN TOÀN khi tạo LiveSession (HTTP 403, code LIVE_ADMIN_OPERATION_NOT_ALLOWED)"
    );

    const reqAdminActive = {
      user: { id: adminId.toString(), _id: adminId, role: "admin" },
      params: { classId: classIdStr },
    };
    const resAdminActive = createMockRes();
    nextCalled = false;
    await checkClassEnrollment(reqAdminActive, resAdminActive, () => { nextCalled = true; });

    assert(
      !nextCalled &&
        resAdminActive.statusCode === 403 &&
        resAdminActive.jsonData?.code === "LIVE_ADMIN_OPERATION_NOT_ALLOWED",
      "Admin bị CHẶN HOÀN TOÀN khi xem Active Session (HTTP 403, code LIVE_ADMIN_OPERATION_NOT_ALLOWED)"
    );

    // 3. Teacher Owner Tạo Session V2 (POST /api/live/sessions)
    const reqTeacherCreate = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      body: { classId: classIdStr, title: "Buổi V2 Chuẩn - Thuật toán" },
      params: {},
      app: { get: () => null },
    };
    const resTeacherCreate = createMockRes();
    await createLiveSession(reqTeacherCreate, resTeacherCreate);

    assert(resTeacherCreate.statusCode === 201, "Teacher Owner tạo LiveSession V2 trả HTTP 201 Created");
    const createdData = resTeacherCreate.jsonData?.data;
    assert(createdData.status === "Live", "Session V2 có status = Live");
    assert(createdData.sessionNumber === 1, "Session V2 có sessionNumber = 1");
    const sessionIdStr = createdData.id;

    // 4. Student Enrolled xem Active Session V2 (GET /api/live/classes/:classId/active)
    const reqStudentActive = {
      user: { id: studentEnrolledId.toString(), _id: studentEnrolledId, role: "student" },
      params: { classId: classIdStr },
      originalUrl: "/api/live/classes/" + classIdStr + "/active",
    };
    const resStudentActive = createMockRes();
    await getActiveLiveSession(reqStudentActive, resStudentActive);
    assert(resStudentActive.statusCode === 200, "Student Enrolled lấy Active Session V2 thành công");
    assert(resStudentActive.jsonData?.data?.id === sessionIdStr, "Active Session V2 trả đúng sessionId");

    // 5. Teacher Owner xem Chi Tiết Session V2 (GET /api/live/sessions/:sessionId)
    const reqDetail = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      params: { sessionId: sessionIdStr },
    };
    const resDetail = createMockRes();
    await getLiveSessionDetail(reqDetail, resDetail);
    assert(resDetail.statusCode === 200, "GET Session Detail V2 trả HTTP 200 OK");
    assert(resDetail.jsonData?.data?.roomName.startsWith("lms_"), "Detail V2 có roomName chuẩn format lms_");

    // 6. Student Enrolled Lấy Token V2 (POST /api/live/sessions/:sessionId/token)
    const reqTokenV2 = {
      user: { id: studentEnrolledId.toString(), _id: studentEnrolledId, role: "student", name: "Sinh viên Test" },
      params: { sessionId: sessionIdStr },
      body: {},
      originalUrl: `/api/live/sessions/${sessionIdStr}/token`,
    };
    const resTokenV2 = createMockRes();
    await generateJaasTokenForSession(reqTokenV2, resTokenV2);
    assert(resTokenV2.statusCode === 200, "Student Enrolled nhận Token JaaS V2 thành công");
    assert(resTokenV2.jsonData?.data?.moderator === false, "Student Enrolled nhận Token V2 với moderator = false");
    assert(resTokenV2.jsonData?.data?.roomName === createdData.roomName, "Token V2 roomName khớp với Session");

    // 7. Teacher Owner xem Lịch sử Session (GET /api/live/classes/:classId/sessions)
    const reqHistory = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      params: { classId: classIdStr },
      query: { page: 1, limit: 10 },
    };
    const resHistory = createMockRes();
    await getLiveSessionHistory(reqHistory, resHistory);
    assert(resHistory.statusCode === 200, "Teacher Owner lấy Session History V2 thành công");
    assert(resHistory.jsonData?.data?.items?.length === 1, "Session History có đúng 1 item");
    assert(resHistory.jsonData?.data?.pagination?.totalItems === 1, "Pagination totalItems = 1");

    // 8. Teacher Owner kết thúc Session V2 (PATCH /api/live/sessions/:sessionId/end)
    const reqEndV2 = {
      user: { id: teacherOwnerId.toString(), _id: teacherOwnerId, role: "teacher" },
      params: { sessionId: sessionIdStr },
      body: {},
      app: { get: () => null },
    };
    const resEndV2 = createMockRes();
    await endLiveSession(reqEndV2, resEndV2);
    assert(resEndV2.statusCode === 200, "Teacher Owner kết thúc Session V2 thành công (HTTP 200 OK)");

    // 9. Test Migration Script (Dry-run & Apply)
    const dryRunReport = await migrateLiveSessionV2({ apply: false });
    assert(dryRunReport.mode === "dry-run", "Migration dry-run thực thi không thay đổi DB");

    const applyReport = await migrateLiveSessionV2({ apply: true });
    assert(applyReport.mode === "apply", "Migration apply thực thi thành công");

    // 10. Dọn dẹp dữ liệu thử nghiệm
    await LiveSession.deleteMany({ classId: testClass._id });
    await classModel.deleteOne({ _id: testClass._id });
    console.log("🧹 Đã dọn dẹp Sprint J3 Test Data thành công.");
  } catch (err) {
    assert(false, `Integration Test Sprint J3 ném ngoại lệ: ${err.message}`);
    console.error(err);
  }

  console.log(`\n📊 Sprint J3 Integration Test Summary: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runSprintJ3IntegrationTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
