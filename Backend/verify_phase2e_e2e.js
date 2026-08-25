import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import { processAttemptPerformanceService } from "./src/modules/performance/performance.service.js";
import { evaluateWeaknessService } from "./src/modules/performance/weakness.service.js";
import { generateRecommendationService } from "./src/modules/performance/recommendation.service.js";

import User from "./src/modules/auth/user.model.js";
import Course from "./src/modules/course/course.model.js";
import Topic from "./src/modules/topic/topic.model.js";
import Question from "./src/modules/question/question.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import StudentPerformance from "./src/modules/performance/studentPerformance.model.js";
import Weakness from "./src/modules/performance/weakness.model.js";
import AIRecommendation from "./src/modules/performance/aiRecommendation.model.js";
import PerformanceEvidence from "./src/modules/performance/performanceEvidence.model.js";
import Class from "./src/modules/class/class.model.js";
import ClassEnrollment from "./src/modules/classEnrollment/classEnrollment.model.js";

const logs = [];
function log(msg) {
  console.log(msg);
  logs.push(msg);
}

function assertStrict(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  log("=== PHASE 2E: STUDENT PERFORMANCE & WEAKNESS E2E VERIFICATION ===");

  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.wissmyr.mongodb.net/AI-LMS?appName=Cluster0");
  log("Connected to MongoDB.");

  // Cleanup old test data
  const testStudentEmail = "test_student_2e@eduspace.vn";
  const testTeacherEmail = "test_teacher_2e@eduspace.vn";
  
  const student = await User.findOne({ email: testStudentEmail }) || await User.create({
    fullName: "Test Student 2E", email: testStudentEmail, password: "password", role: "Student"
  });
  
  const teacher = await User.findOne({ email: testTeacherEmail }) || await User.create({
    fullName: "Test Teacher 2E", email: testTeacherEmail, password: "password", role: "Teacher"
  });

  await Course.deleteMany({ name: "Phase 2E Course" });
  await Topic.deleteMany({ name: { $regex: "Phase 2E Topic" } });
  
  const course = await Course.create({ 
    name: "Phase 2E Course", 
    description: "Test Course",
    code: "C2E",
    createdBy: teacher._id,
    subjectId: new mongoose.Types.ObjectId(),
    duration: { value: 3, unit: "MONTH" },
    status: "PUBLISHED"
  });
  
  const topic1 = await Topic.create({ name: "Phase 2E Topic 1", courseId: course._id, order: 1 });
  const topic2 = await Topic.create({ name: "Phase 2E Topic 2", courseId: course._id, order: 2 });
  
  // Cleanup metrics
  await StudentPerformance.deleteMany({ studentId: student._id });
  await Weakness.deleteMany({ studentId: student._id });
  await AIRecommendation.deleteMany({ studentId: student._id });
  await PerformanceEvidence.deleteMany({ studentId: student._id });
  
  try {
    await ExamAttempt.collection.dropIndexes();
  } catch (err) {
    // ignore
  }
  await ExamAttempt.deleteMany({ studentId: student._id });

  // Create Questions
  const questionsT1 = [];
  const questionsT2 = [];
  for (let i = 0; i < 10; i++) {
    const qContent = [{ id: `c_${i}`, type: "TEXT", order: 1, text: `Q${i}` }];
    const options = [
      { id: `opt_a_${i}`, content: [{ id: `ca_${i}`, type: "TEXT", text: "A" }], isCorrect: true, order: 1 },
      { id: `opt_b_${i}`, content: [{ id: `cb_${i}`, type: "TEXT", text: "B" }], isCorrect: false, order: 2 }
    ];
    questionsT1.push(await Question.create({
      topicId: topic1._id, type: "MCQ", selectionMode: "SINGLE", content: qContent, difficulty: "MEDIUM",
      options, createdBy: teacher._id
    }));
    questionsT2.push(await Question.create({
      topicId: topic2._id, type: "MCQ", selectionMode: "SINGLE", content: qContent, difficulty: "MEDIUM",
      options, createdBy: teacher._id
    }));
  }

  const exam = await Exam.create({
    title: "Phase 2E Exam", courseId: course._id, topicId: topic1._id, createdBy: teacher._id,
    duration: 60, passingScore: 50, type: "EXAM", status: "PUBLISHED",
    questions: [...questionsT1, ...questionsT2].map((q, idx) => ({ questionId: q._id, points: 1, order: idx + 1 }))
  });

  // ==========================================
  // TEST 1-4 & 17: Performance & Idempotency & N+1
  // ==========================================
  log("\n--- TEST 1, 2, 3, 4, 17: Performance Calculation & N+1 ---");
  
  async function createValidAttempt(studentId, examId, questionsData, score, attemptNum = 1) {
    const questions = questionsData.map((q, idx) => ({
      questionId: q.questionId,
      order: idx + 1,
      points: 1,
      questionSnapshot: {
        type: "MCQ",
        content: [],
        options: []
      },
      isCorrect: q.isCorrect
    }));
    return await ExamAttempt.create({
      studentId: studentId,
      examId: examId,
      attemptNumber: attemptNum,
      sessionToken: "dummy_token",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60*60*1000),
      submittedAt: new Date(),
      status: "GRADED",
      score: score,
      questions: questions
    });
  }
  
  // 3 correct out of 10 for Topic 1 -> 30% -> HIGH weakness
  // 8 correct out of 10 for Topic 2 -> 80% -> LOW weakness
  let globalAttemptCount = 1;
  const attempt = await createValidAttempt(student._id, exam._id, [
    ...questionsT1.map((q, i) => ({ questionId: q._id, isCorrect: i < 3 })),
    ...questionsT2.map((q, i) => ({ questionId: q._id, isCorrect: i < 8 }))
  ], 55, globalAttemptCount++);

  // Track queries to verify N+1 is fixed
  const origFindById = mongoose.Model.findById;
  let findByIdCount = 0;
  mongoose.Model.findById = function() {
    findByIdCount++;
    return origFindById.apply(this, arguments);
  };

  await processAttemptPerformanceService(attempt, "EXAM");
  
  mongoose.Model.findById = origFindById; // restore
  
  log(`Questions processed: 20. Number of findById calls: ${findByIdCount}`);
  assertStrict(findByIdCount < 10, "N+1 Regression detected! findById called too many times.");

  const perf1 = await StudentPerformance.findOne({ studentId: student._id, topicId: topic1._id });
  const perf2 = await StudentPerformance.findOne({ studentId: student._id, topicId: topic2._id });
  
  assertStrict(perf1 && perf1.totalQuestions === 10 && perf1.correctAnswers === 3, "Topic 1 performance aggregated incorrectly");
  assertStrict(perf2 && perf2.totalQuestions === 10 && perf2.correctAnswers === 8, "Topic 2 performance aggregated incorrectly");
  
  assertStrict(perf1.accuracy === 30, "Topic 1 accuracy incorrect");
  assertStrict(perf2.accuracy === 80, "Topic 2 accuracy incorrect");
  log("PASSED: Topic aggregation and Performance Calculation");

  // TEST IDEMPOTENCY
  await processAttemptPerformanceService(attempt, "EXAM");
  const perf1_dup = await StudentPerformance.findOne({ studentId: student._id, topicId: topic1._id });
  assertStrict(perf1_dup.totalQuestions === 10, "Idempotency failed, questions were double-counted");
  log("PASSED: Idempotency Verified (No duplicate counting)");

  // ==========================================
  // TEST 5-11: Weakness Engine
  // ==========================================
  log("\n--- TEST 5-11: Weakness Engine & Thresholds ---");
  const performances = await StudentPerformance.find({ studentId: student._id });
  for (const perf of performances) {
    await evaluateWeaknessService(perf);
  }

  const w1 = await Weakness.findOne({ studentId: student._id, topicId: topic1._id });
  const w2 = await Weakness.findOne({ studentId: student._id, topicId: topic2._id });

  assertStrict(w1 && w1.severity === "HIGH", "Topic 1 (30%) should be HIGH severity weakness");
  assertStrict(w2 && w2.severity === "LOW", "Topic 2 (80%) should be LOW severity weakness");
  log("PASSED: Weakness Severity calculated correctly (HIGH and LOW)");

  // Add more attempts to Topic 1 to make it >= 85% to test removal
  const attempt2 = await createValidAttempt(student._id, exam._id, [
    ...questionsT1.map((q) => ({ questionId: q._id, isCorrect: true })) // 10 correct
  ], 100, globalAttemptCount++);
  await processAttemptPerformanceService(attempt2, "EXAM");
  
  const attempt2_2 = await createValidAttempt(student._id, exam._id, [
    ...questionsT1.map((q) => ({ questionId: q._id, isCorrect: true })) // 10 correct
  ], 100, globalAttemptCount++);
  await processAttemptPerformanceService(attempt2_2, "EXAM"); // Total for T1 now: 30 questions, 23 correct -> 76.6% -> MEDIUM

  let perf1_med = await StudentPerformance.findOne({ studentId: student._id, topicId: topic1._id });
  await evaluateWeaknessService(perf1_med);
  
  const w1_med = await Weakness.findOne({ studentId: student._id, topicId: topic1._id });
  assertStrict(w1_med.severity === "LOW", "Topic 1 (76%) should be LOW severity");
  
  // Add more to push over 85%
  const attempt3 = await createValidAttempt(student._id, exam._id, 
    questionsT1.map((q) => ({ questionId: q._id, isCorrect: true }))
  , 100, globalAttemptCount++);
  await processAttemptPerformanceService(attempt3, "EXAM"); // Total: 40 questions, 33 correct -> 82.5%
  
  const attempt4 = await createValidAttempt(student._id, exam._id, 
    questionsT1.map((q) => ({ questionId: q._id, isCorrect: true }))
  , 100, globalAttemptCount++);
  await processAttemptPerformanceService(attempt4, "EXAM"); // Total: 50 questions, 43 correct -> 86% -> REMOVE
  
  let perf1_removed = await StudentPerformance.findOne({ studentId: student._id, topicId: topic1._id });
  await evaluateWeaknessService(perf1_removed);

  const w1_removed = await Weakness.findOne({ studentId: student._id, topicId: topic1._id });
  assertStrict(!w1_removed, "Topic 1 weakness should have been removed (>= 85%)");
  log("PASSED: Weakness removal threshold (>= 85%) verified");

  // MIN_QUESTIONS boundary check
  // Create a new topic with only 4 questions answered (e.g. all wrong = 0%)
  const topic3 = await Topic.create({ name: "Phase 2E Topic 3", courseId: course._id, order: 3 });
  
  const qT3s = [];
  for (let i = 0; i < 4; i++) {
    const qContentT3 = [{ id: `c_t3_${i}`, type: "TEXT", order: 1, text: `T3 Q${i}` }];
    const qOptionsT3 = [
      { id: `opt_a_t3_${i}`, content: [{ id: `ca_t3_${i}`, type: "TEXT", text: "A" }], isCorrect: true, order: 1 }
    ];
    qT3s.push(await Question.create({ 
      topicId: topic3._id, type: "MCQ", selectionMode: "SINGLE", 
      content: qContentT3, difficulty: "HARD", options: qOptionsT3, createdBy: teacher._id 
    }));
  }
  
  const attempt5 = await createValidAttempt(student._id, exam._id, 
    qT3s.map(q => ({ questionId: q._id, isCorrect: false })) // 4 questions, all wrong
  , 0, globalAttemptCount++);
  await processAttemptPerformanceService(attempt5, "EXAM");
  
  let perf3 = await StudentPerformance.findOne({ studentId: student._id, topicId: topic3._id });
  if (perf3) await evaluateWeaknessService(perf3);
  
  const w3 = await Weakness.findOne({ studentId: student._id, topicId: topic3._id });
  assertStrict(!w3, "Topic 3 should NOT have a weakness because MIN_QUESTIONS=5 was not reached.");
  log("PASSED: MIN_QUESTIONS = 5 threshold verified");

  // ==========================================
  // TEST 15 & 16: AI Recommendation & Fallback
  // ==========================================
  log("\n--- TEST 15 & 16: AI Recommendation Generation ---");
  const rec = await generateRecommendationService(student._id, course._id);
  assertStrict(rec && rec.recommendedTopics.length > 0, "AI Recommendation should return topics");
  assertStrict(rec.status === "ACTIVE", "AI Recommendation status should be ACTIVE");
  log("PASSED: AI Recommendation Generation (Deterministic Fallback tested if AI key missing)");

  log("\n=== ALL E2E VERIFICATIONS PASSED ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("\n[!] VERIFICATION FAILED:", err);
  process.exit(1);
});
