import mongoose from "mongoose";
import 'dotenv/config';

import jwt from "jsonwebtoken";
import User from "./src/modules/auth/user.model.js";
import Class from "./src/modules/class/class.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=== BẮT ĐẦU E2E TEST: TABID SESSION & CHEAT QUEUE ===");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let student = await User.findOne({ email: "test_e2e_bugfix@example.com" });
  if (!student) {
    student = await User.create({
      fullName: "Test E2E Student",
      email: "test_e2e_bugfix@example.com",
      password: "password123",
      role: "Student",
      status: "Active"
    });
  }

  const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const authHeaders = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  let testClass = await Class.findOne({ className: "Test Class E2E Bugs" });
  if (!testClass) {
    testClass = await Class.create({
      className: "Test Class E2E Bugs",
      courseId: new mongoose.Types.ObjectId(),
      description: "Class for testing exam bugs",
      teacher: student._id,
      students: [{ studentId: student._id, status: "Enrolled" }]
    });
  }

  let examReady = await Exam.findOne({ title: "Test Exam Ready" });
  if (!examReady) {
    examReady = await Exam.create({
      title: "Test Exam Ready",
      classId: testClass._id,
      creator: student._id,
      duration: 60,
      status: "PUBLISHED",
      startTime: new Date(Date.now() - 1800000)
    });
  } else {
    await Exam.updateOne({ _id: examReady._id }, { status: "PUBLISHED", isDeleted: false, startTime: new Date(Date.now() - 1800000) });
  }
  
  await ExamAttempt.deleteMany({ examId: examReady._id });
  console.log("Test data ready.\n");

  let testResults = [];

  console.log("--- BƯỚC 1: Khởi tạo phiên thi (Tab 1) ---");
  const tabId_1 = "tab_111111";
  let res1 = await fetch(`${BASE_URL}/api/exam-attempts/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ examId: examReady._id.toString(), tabId: tabId_1 })
  });
  let data1 = await res1.json();
  const attemptId = data1.data?._id;
  const sessionToken = data1.data?.sessionToken;
  console.log(`[Tab 1] Response: HTTP ${res1.status}`);
  console.log(data1.message);

  console.log("\n--- BƯỚC 2: Cùng token, khác tabId, phiên cũ CÒN SỐNG (Mô phỏng 2 tab) ---");
  const tabId_2 = "tab_222222";
  let res2 = await fetch(`${BASE_URL}/api/exam-attempts/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ examId: examReady._id.toString(), sessionToken, tabId: tabId_2 })
  });
  let data2 = await res2.json();
  console.log(`[Tab 2 - ALIVE] Response: HTTP ${res2.status}`);
  console.log(data2);
  const test2Pass = res2.status === 409 && data2.errorCode === "SESSION_ACTIVE";
  testResults.push({ Test: "2 tabs active", Expected: "409 SESSION_ACTIVE", Result: test2Pass ? "PASS" : "FAIL" });

  console.log("\n--- BƯỚC 3: Cùng token, khác tabId, phiên cũ ĐÃ CHẾT (Mô phỏng rớt mạng/sập tab vô lại) ---");
  // Ép session chết trong DB (lùi heartbeat về 65s trước)
  await ExamAttempt.updateOne({ _id: attemptId }, { lastHeartbeat: new Date(Date.now() - 65000) });
  
  const tabId_3 = "tab_333333";
  let res3 = await fetch(`${BASE_URL}/api/exam-attempts/start`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ examId: examReady._id.toString(), sessionToken, tabId: tabId_3 })
  });
  let data3 = await res3.json();
  console.log(`[Tab 3 - DEAD] Response: HTTP ${res3.status}`);
  console.log(data3.message);
  const test3Pass = res3.status === 200 && data3.message.includes("Khôi phục");
  testResults.push({ Test: "Crash recovery", Expected: "200 Khôi phục phiên", Result: test3Pass ? "PASS" : "FAIL" });

  console.log("\n--- BƯỚC 4: Gửi cảnh báo gian lận 5 lần ---");
  let cheatPass = true;
  for (let i = 1; i <= 4; i++) {
    let resCheat = await fetch(`${BASE_URL}/api/exam-attempts/${attemptId}/warning`, {
      method: "POST",
      headers: { ...authHeaders, "x-session-token": sessionToken },
      body: JSON.stringify({ cheatType: "TAB_SWITCH" })
    });
    let dataCheat = await resCheat.json();
    if (resCheat.status !== 200 || dataCheat.cheatWarnings !== i) {
      cheatPass = false;
    }
  }
  
  let resCheat5 = await fetch(`${BASE_URL}/api/exam-attempts/${attemptId}/warning`, {
    method: "POST",
    headers: { ...authHeaders, "x-session-token": sessionToken },
    body: JSON.stringify({ cheatType: "TAB_SWITCH" })
  });
  let dataCheat5 = await resCheat5.json();
  console.log(`[Cheat 5] Response: HTTP ${resCheat5.status}`);
  console.log(dataCheat5);
  
  const attemptDb = await ExamAttempt.findById(attemptId);
  console.log(`DB Status after Cheat 5: ${attemptDb.status}, Warnings: ${attemptDb.cheatWarnings}`);
  const test4Pass = dataCheat5.errorCode === "CHEAT_THRESHOLD_REACHED" && attemptDb.cheatWarnings === 5 && ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"].includes(attemptDb.status);
  testResults.push({ Test: "Cheat 5 times", Expected: "CHEAT_THRESHOLD_REACHED & SUBMITTED/GRADED", Result: test4Pass ? "PASS" : "FAIL" });

  console.log("\n=== TỔNG KẾT ===");
  console.table(testResults);
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
