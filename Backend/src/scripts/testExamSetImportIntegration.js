import mongoose from "mongoose";
import assert from "assert";
import * as xlsx from "xlsx";
import crypto from "crypto";
import dotenv from "dotenv";

import { User } from "#modules/auth";
import { Folder } from "#modules/folder";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { Question } from "#modules/question";
import { importExcelToExamSet } from "#modules/exam-set/examSetImport.service.js";

dotenv.config();

function createExcelBuffer(data) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function runIntegrationTests() {
  console.log("==================================================");
  console.log("🧪 TESTING EXAMSET IMPORT INTEGRATION");
  console.log("==================================================\n");

  if (process.env.NODE_ENV !== "test") {
    console.error("❌ NODE_ENV must be 'test'");
    process.exit(1);
  }

  const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ailms_test";
  if (!dbUri.endsWith("_test")) {
    console.error("❌ Database URI must end with '_test'");
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log("✅ Connected to Test DB");

  let passed = 0;
  let failed = 0;
  const cleanupIds = { users: [], folders: [], examSets: [] };

  const assertTest = (condition, msg) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Setup Test Data
    const teacherId = new mongoose.Types.ObjectId();
    const folderId = new mongoose.Types.ObjectId();

    const user = new User({
      _id: teacherId,
      email: `teacher_${Date.now()}@test.com`,
      password: "password123",
      fullName: "Test Teacher",
      role: "Teacher",
    });
    await user.save();
    cleanupIds.users.push(teacherId);

    const folder = new Folder({
      _id: folderId,
      ownerId: teacherId,
      name: "Test Folder",
    });
    await folder.save();
    cleanupIds.folders.push(folderId);

    // Get initial question count
    const initialQuestionCount = await Question.countDocuments();

    // 2. Test valid import
    console.log("\n1. Testing Valid Import");
    const validData = [
      { content: "Q1", type: "MCQ", options: "A|B", correctAnswer: "A", points: 2 },
      { content: "Q2", type: "ESSAY", points: 5 },
    ];
    const validBuffer = createExcelBuffer(validData);

    const examSet = await importExcelToExamSet({
      fileBuffer: validBuffer,
      ownerId: teacherId,
      folderId,
      title: "Test Exam 1",
      description: "Desc",
    });
    cleanupIds.examSets.push(examSet._id);

    assertTest(examSet.title === "Test Exam 1", "Creates one ExamSet document");
    assertTest(examSet.status === "draft", "ExamSet is in draft status");
    assertTest(examSet.questions.length === 2, "Questions are embedded in examSet.questions[]");
    assertTest(examSet.questionCount === 2, "questionCount is exact");
    assertTest(examSet.totalPoints === 7, "totalPoints is calculated correctly");
    assertTest(String(examSet.ownerId) === String(teacherId), "ownerId is correctly assigned");

    const finalQuestionCount = await Question.countDocuments();
    assertTest(
      initialQuestionCount === finalQuestionCount,
      "Does NOT create document in 'questions' collection"
    );

    // 3. Test Access Control
    console.log("\n2. Testing Access Control & Validation");

    // Thiếu folderId
    try {
      await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId: teacherId,
        folderId: "",
        title: "T",
      });
      assertTest(false, "Should throw Thiếu folderId");
    } catch (err) {
      assertTest(
        err.statusCode === 400 && err.message === "Thiếu folderId",
        "Trả về 400 Thiếu folderId"
      );
    }

    // folderId không hợp lệ
    try {
      await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId: teacherId,
        folderId: "invalid",
        title: "T",
      });
      assertTest(false, "Should throw folderId không hợp lệ");
    } catch (err) {
      assertTest(
        err.statusCode === 400 && err.message === "folderId không hợp lệ",
        "Trả về 400 folderId không hợp lệ"
      );
    }

    // Folder không tồn tại
    try {
      await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId: teacherId,
        folderId: new mongoose.Types.ObjectId(),
        title: "T",
      });
      assertTest(false, "Should throw Folder không tồn tại");
    } catch (err) {
      assertTest(
        err.statusCode === 404 && err.message === "Folder không tồn tại",
        "Trả về 404 Folder không tồn tại"
      );
    }

    // Folder thuộc người khác
    try {
      await importExcelToExamSet({
        fileBuffer: validBuffer,
        ownerId: new mongoose.Types.ObjectId(),
        folderId,
        title: "T",
      });
      assertTest(false, "Should throw Không có quyền truy cập Folder");
    } catch (err) {
      assertTest(
        err.statusCode === 403 && err.message === "Không có quyền truy cập Folder",
        "Trả về 403 Không có quyền truy cập Folder"
      );
    }
  } catch (error) {
    console.error("❌ Exception during test execution:", error);
    failed++;
  } finally {
    // Cleanup by ID
    await User.deleteMany({ _id: { $in: cleanupIds.users } });
    await Folder.deleteMany({ _id: { $in: cleanupIds.folders } });
    await ExamSet.deleteMany({ _id: { $in: cleanupIds.examSets } });
    console.log("🧹 Cleaned up test data by IDs");
    await mongoose.disconnect();
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runIntegrationTests();
