import mongoose from "mongoose";
import assert from "assert";
import dotenv from "dotenv";
import { connectDB } from "../config/database.js";
import Class from "../models/class.model.js";
import Lesson from "../models/lesson.model.js";
import User from "../models/user.model.js";
import AISummary from "../models/aiSummary.model.js";
import AIUsage from "../models/aiUsage.model.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middleware.js";

dotenv.config();

async function runIntegrationTests() {
  if (process.env.NODE_ENV !== "test") {
    console.error("❌ Môi trường không phải là 'test'. Dừng thực thi để bảo vệ dữ liệu.");
    process.exit(1);
  }

  if (
    !process.env.MONGO_TEST_URI ||
    !process.env.MONGO_TEST_URI.endsWith("_test?appName=Cluster0")
  ) {
    console.error("❌ Cấu hình MONGO_TEST_URI không an toàn (phải kết thúc bằng _test).");
    process.exit(1);
  }

  console.log("🚀 Bắt đầu Integration Test AI Summary...");
  await connectDB(process.env.MONGO_TEST_URI);

  let passed = 0;
  let failed = 0;

  const runTest = async (name, testFn) => {
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Lỗi: ${err.message}`);
      failed++;
    }
  };

  try {
    await AISummary.deleteMany({});
    await Class.deleteMany({});
    await Lesson.deleteMany({});
    await User.deleteMany({});

    // Tạo dữ liệu giả lập
    const teacher1 = await User.create({
      name: "GV1",
      email: "gv1@test.com",
      password: "123",
      role: "teacher",
    });
    const teacher2 = await User.create({
      name: "GV2",
      email: "gv2@test.com",
      password: "123",
      role: "teacher",
    });
    const student1 = await User.create({
      name: "HS1",
      email: "hs1@test.com",
      password: "123",
      role: "student",
    });
    const student2 = await User.create({
      name: "HS2",
      email: "hs2@test.com",
      password: "123",
      role: "student",
    });

    const class1 = await Class.create({
      className: "Lớp 1",
      courseId: new mongoose.Types.ObjectId(),
      meetingRoomId: "123",
      teacherId: teacher1._id,
      students: [{ studentId: student1._id, status: "Enrolled" }],
    });

    const lesson1 = await Lesson.create({
      title: "Bài 1",
      classId: class1._id,
      teacherId: teacher1._id,
      isPublished: true,
    });

    // Test Middleware
    const mockRequest = (user, lessonId, method = "GET") => ({
      user,
      params: { lessonId },
      method,
    });
    const mockResponse = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.data = data;
        return res;
      };
      return res;
    };

    await runTest("Middleware: Teacher đúng lớp được qua", async () => {
      const req = mockRequest(teacher1, lesson1._id);
      const res = mockResponse();
      let nextCalled = false;
      await checkAILessonAccess(req, res, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true, "Next phải được gọi");
    });

    await runTest("Middleware: Teacher khác lớp bị từ chối 403", async () => {
      const req = mockRequest(teacher2, lesson1._id);
      const res = mockResponse();
      await checkAILessonAccess(req, res, () => {});
      assert.strictEqual(res.statusCode, 403);
    });

    await runTest("Middleware: Student trong lớp được qua (GET)", async () => {
      const req = mockRequest(student1, lesson1._id, "GET");
      const res = mockResponse();
      let nextCalled = false;
      await checkAILessonAccess(req, res, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);
    });

    await runTest("Middleware: Student trong lớp gọi POST bị 403", async () => {
      const req = mockRequest(student1, lesson1._id, "POST");
      const res = mockResponse();
      await checkAILessonAccess(req, res, () => {});
      assert.strictEqual(res.statusCode, 403);
    });

    await runTest("Middleware: Student ngoài lớp bị từ chối", async () => {
      const req = mockRequest(student2, lesson1._id, "GET");
      const res = mockResponse();
      await checkAILessonAccess(req, res, () => {});
      assert.strictEqual(res.statusCode, 403);
    });
  } finally {
    console.log(`\n🏁 Kết quả Integration Test: ${passed} PASS, ${failed} FAIL`);
    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  }
}

runIntegrationTests();
