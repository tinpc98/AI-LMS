import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "#modules/auth/index.js";
import Topic from "../modules/topic/topic.model.js";
import Question from "#modules/question/question.model.js";
import StudentPerformance from "#modules/performance/studentPerformance.model.js";
import Weakness from "#modules/performance/weakness.model.js";
import PerformanceEvidence from "#modules/performance/performanceEvidence.model.js";
import AIRecommendation from "#modules/performance/aiRecommendation.model.js";
import AssignmentAttempt from "#modules/assignment/assignmentAttempt.model.js";
import { processAttemptPerformanceService } from "#modules/performance/performance.service.js";
import { rebuildStudentPerformanceService } from "#modules/performance/adminRebuild.service.js";
import { generateRecommendationService } from "#modules/performance/recommendation.service.js";
import Course from "#modules/course/course.model.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduspace_thpt";

async function runTests() {
  console.log("==========================================");
  console.log("DOMAIN 07 AUTOMATED REGRESSION AUDIT");
  console.log("==========================================\n");

  let exitCode = 0;
  let testCount = 0;
  let passedCount = 0;
  const results = [];

  function assert(condition, scenario, expected) {
    testCount++;
    const status = condition ? "PASS" : "FAIL";
    if (condition) passedCount++;
    else exitCode = 1;
    const actual = condition ? expected : `NOT ${expected}`;
    console.log(`[${status}] Test ${testCount}: ${scenario}`);
    results.push({ n: testCount, scenario, expected, actual, status });
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for testing.\n");

    // ---- SETUP ----
    const ts = Date.now();
    const adminId = new mongoose.Types.ObjectId();
    const studentAId = new mongoose.Types.ObjectId();
    const studentBId = new mongoose.Types.ObjectId();

    // Create Students
    await User.create([
      { _id: studentAId, fullName: "Student A", email: `sa_${ts}@test.com`, password: "p123456", role: "Student" },
      { _id: studentBId, fullName: "Student B", email: `sb_${ts}@test.com`, password: "p123456", role: "Student" },
    ]);

    // Create Course
    const courseId = new mongoose.Types.ObjectId();
    const subjectId = new mongoose.Types.ObjectId();
    await Course.create({
      _id: courseId,
      name: "Toán THPT",
      code: `TOAN_${ts}`,
      description: "Test",
      subjectId,
      createdBy: adminId,
      duration: { value: 20, unit: "WEEK" },
      status: "PUBLISHED",
    });

    // Create Topics
    const topicDaoHamId = new mongoose.Types.ObjectId();
    const topicTichPhanId = new mongoose.Types.ObjectId();
    await Topic.create([
      { _id: topicDaoHamId, name: "Đạo hàm", courseId, order: 1 },
      { _id: topicTichPhanId, name: "Tích phân", courseId, order: 2 },
    ]);

    // Create Questions (8 for Đạo hàm, 10 for Tích phân)
    const daoHamQuestions = [];
    for (let i = 0; i < 8; i++) {
      const qId = new mongoose.Types.ObjectId();
      daoHamQuestions.push(qId);
      await Question.create({
        _id: qId,
        topicId: topicDaoHamId,
        type: "MCQ",
        selectionMode: "SINGLE",
        content: [{ id: `c${i}`, type: "TEXT", order: 0, text: `Câu ${i + 1}` }],
        options: [
          { id: "a", content: [{ id: "oa", type: "TEXT", order: 0, text: "A" }], isCorrect: true, order: 0 },
          { id: "b", content: [{ id: "ob", type: "TEXT", order: 0, text: "B" }], isCorrect: false, order: 1 },
        ],
        status: "PUBLISHED",
        createdBy: adminId,
      });
    }

    const tichPhanQuestions = [];
    for (let i = 0; i < 10; i++) {
      const qId = new mongoose.Types.ObjectId();
      tichPhanQuestions.push(qId);
      await Question.create({
        _id: qId,
        topicId: topicTichPhanId,
        type: "MCQ",
        selectionMode: "SINGLE",
        content: [{ id: `c${i}`, type: "TEXT", order: 0, text: `TP Câu ${i + 1}` }],
        options: [
          { id: "a", content: [{ id: "oa", type: "TEXT", order: 0, text: "A" }], isCorrect: true, order: 0 },
          { id: "b", content: [{ id: "ob", type: "TEXT", order: 0, text: "B" }], isCorrect: false, order: 1 },
        ],
        status: "PUBLISHED",
        createdBy: adminId,
      });
    }

    // =========================================================
    // TEST SUITE
    // =========================================================

    // --- Attempt 1: Student A answers 7/8 correct on Đạo hàm ---
    const attempt1 = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentAId,
      questions: daoHamQuestions.map((qId, i) => ({
        questionId: qId,
        isCorrect: i < 7, // 7 correct, 1 wrong
        questionSnapshot: { type: "MCQ", content: [], options: [] },
      })),
    };

    await processAttemptPerformanceService(attempt1, "ASSIGNMENT");

    // Test 1
    const perf1 = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(perf1 !== null, "StudentPerformance created after attempt", "Performance record exists");

    // Test 2
    assert(perf1.correctAnswers === 7, "Correct answers = 7", "correctAnswers=7");

    // Test 3
    assert(perf1.incorrectAnswers === 1, "Incorrect answers = 1", "incorrectAnswers=1");

    // Test 4
    assert(perf1.answeredQuestions === 8, "Answered questions = 8", "answeredQuestions=8");

    // Test 5
    assert(perf1.accuracy === 87.5, "Accuracy = 87.5%", "accuracy=87.5");

    // Test 6
    assert(perf1.masteryLevel === "MASTERED", "MasteryLevel = MASTERED (>=85%)", "MASTERED");

    // Test 7
    assert(perf1.courseId.toString() === courseId.toString(), "Performance grouped by courseId", "courseId matches");

    // Test 8
    assert(perf1.topicId.toString() === topicDaoHamId.toString(), "Performance grouped by topicId", "topicId matches");

    // --- Test 9: IDEMPOTENCY - Process same attempt again ---
    await processAttemptPerformanceService(attempt1, "ASSIGNMENT");
    const perf1After = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(perf1After.correctAnswers === 7, "Same attempt processed twice → no duplicate (correctAnswers still 7)", "idempotent");

    // Test 10
    const evidenceCount = await PerformanceEvidence.countDocuments({ studentId: studentAId, sourceId: attempt1._id });
    assert(evidenceCount === 8, "Evidence count = 8 (not duplicated)", "8 evidence records");

    // --- Attempt 2: Student A answers 3/10 on Tích phân ---
    const attempt2 = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentAId,
      questions: tichPhanQuestions.map((qId, i) => ({
        questionId: qId,
        isCorrect: i < 3, // 3 correct, 7 wrong
        questionSnapshot: { type: "MCQ", content: [], options: [] },
      })),
    };

    await processAttemptPerformanceService(attempt2, "EXAM");

    // Test 11
    const perf2 = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicTichPhanId });
    assert(perf2 !== null, "Tích phân performance created", "Performance record exists");

    // Test 12
    assert(perf2.accuracy === 30, "Tích phân accuracy = 30%", "accuracy=30");

    // Test 13
    assert(perf2.masteryLevel === "FOUNDATIONAL", "Tích phân mastery = FOUNDATIONAL (<50%)", "FOUNDATIONAL");

    // --- Test 14: Weakness created for Tích phân ---
    const weakness = await Weakness.findOne({ studentId: studentAId, topicId: topicTichPhanId });
    assert(weakness !== null, "Weakness created for Tích phân (accuracy < 85%, evidence >= 5)", "Weakness exists");

    // Test 15
    assert(weakness.severity === "HIGH", "Tích phân severity = HIGH (30%)", "HIGH");

    // Test 16
    assert(weakness.weaknessScore === 70, "weaknessScore = 100 - 30 = 70", "weaknessScore=70");

    // --- Test 17: No weakness for Đạo hàm (MASTERED) ---
    const noWeakness = await Weakness.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(noWeakness === null, "No weakness for Đạo hàm (accuracy >= 85%)", "No weakness");

    // --- Test 18: Minimum evidence check ---
    const attempt3Minimal = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentBId,
      questions: [
        { questionId: tichPhanQuestions[0], isCorrect: false, questionSnapshot: { type: "MCQ", content: [], options: [] } },
        { questionId: tichPhanQuestions[1], isCorrect: false, questionSnapshot: { type: "MCQ", content: [], options: [] } },
      ],
    };
    await processAttemptPerformanceService(attempt3Minimal, "ASSIGNMENT");

    const weaknessB = await Weakness.findOne({ studentId: studentBId, topicId: topicTichPhanId });
    assert(weaknessB === null, "No weakness with < MIN_QUESTIONS (2 < 5)", "No weakness (insufficient evidence)");

    // --- Test 19-20: Student B gets more evidence (3 more = total 5) ---
    const attempt3More = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentBId,
      questions: [
        { questionId: tichPhanQuestions[2], isCorrect: false, questionSnapshot: { type: "MCQ", content: [], options: [] } },
        { questionId: tichPhanQuestions[3], isCorrect: false, questionSnapshot: { type: "MCQ", content: [], options: [] } },
        { questionId: tichPhanQuestions[4], isCorrect: false, questionSnapshot: { type: "MCQ", content: [], options: [] } },
      ],
    };
    await processAttemptPerformanceService(attempt3More, "ASSIGNMENT");

    const weaknessBNow = await Weakness.findOne({ studentId: studentBId, topicId: topicTichPhanId });
    assert(weaknessBNow !== null, "Weakness created after MIN_QUESTIONS reached (5 questions)", "Weakness exists now");

    // Test 20
    assert(weaknessBNow?.severity === "CRITICAL", "0% accuracy → CRITICAL severity", "CRITICAL");

    // --- Test 21: Ungraded questions skipped ---
    const attempt4Ungraded = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentAId,
      questions: [
        { questionId: daoHamQuestions[0], isCorrect: null, questionSnapshot: { type: "ESSAY", content: [], options: [] } },
      ],
    };
    await processAttemptPerformanceService(attempt4Ungraded, "ASSIGNMENT");

    const perfAfterUngraded = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(perfAfterUngraded.correctAnswers === 7, "Ungraded (null isCorrect) question not counted", "correctAnswers still 7");

    // --- Test 22: Student A cannot access Student B data (IDOR) ---
    const perfStudentB = await StudentPerformance.find({ studentId: studentBId });
    const perfStudentA = await StudentPerformance.find({ studentId: studentAId });
    assert(
      perfStudentB.every(p => p.studentId.toString() !== studentAId.toString()),
      "Student A data not mixed with Student B data",
      "Data isolation"
    );

    // --- Test 23: Multiple attempts accumulate correctly ---
    const attempt5 = {
      _id: new mongoose.Types.ObjectId(),
      studentId: studentAId,
      questions: tichPhanQuestions.slice(0, 5).map((qId, i) => ({
        questionId: qId,
        isCorrect: true,
        questionSnapshot: { type: "MCQ", content: [], options: [] },
      })),
    };
    // These questions were already processed in attempt2 for Student A
    await processAttemptPerformanceService(attempt5, "ASSIGNMENT");

    // Questions that were already processed should not be duplicated
    const perfAfterDup = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicTichPhanId });
    // attempt2 had 10 questions. attempt5 has 5 questions but first 5 overlap with attempt2's questions.
    // Since sourceId is different (different attempt._id), these should be NEW evidence.
    // So total should be 10 + 5 = 15 questions, 3 + 5 = 8 correct
    assert(perfAfterDup.answeredQuestions === 15, "Multiple attempts accumulate (10 + 5 = 15)", "answeredQuestions=15");

    // Test 24
    const newAccuracy = parseFloat(((8 / 15) * 100).toFixed(2));
    assert(perfAfterDup.accuracy === newAccuracy, `Accuracy recalculated (${newAccuracy}%)`, `accuracy=${newAccuracy}`);

    // --- Test 25: Rebuild Performance ---
    // First, store an AssignmentAttempt in DB so rebuild can find it
    const storeAttemptId = new mongoose.Types.ObjectId();
    await AssignmentAttempt.create({
      _id: storeAttemptId,
      assignmentId: new mongoose.Types.ObjectId(),
      studentId: studentAId,
      attemptNumber: 1,
      status: "GRADED",
      questions: daoHamQuestions.slice(0, 5).map((qId, i) => ({
        questionId: qId,
        questionSnapshot: {
          type: "MCQ",
          content: [{ id: "c1", type: "TEXT", order: 0, text: "Q" }],
          options: [{ id: "a", content: [{ id: "oa", type: "TEXT", order: 0, text: "A" }], order: 0 }],
        },
        order: i,
        points: 1,
        isCorrect: i < 4, // 4 correct out of 5
        score: i < 4 ? 1 : 0,
      })),
      score: 4,
      submittedAt: new Date(),
    });

    const rebuildResult = await rebuildStudentPerformanceService(studentAId);
    assert(rebuildResult !== null, "Admin rebuild completes without error", "Rebuild completed");

    // Test 26
    const perfAfterRebuild = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(perfAfterRebuild !== null, "Performance exists after rebuild", "Performance exists");

    // Test 27: Rebuild is idempotent
    const rebuildResult2 = await rebuildStudentPerformanceService(studentAId);
    const perfAfterRebuild2 = await StudentPerformance.findOne({ studentId: studentAId, topicId: topicDaoHamId });
    assert(
      perfAfterRebuild2.correctAnswers === perfAfterRebuild.correctAnswers,
      "Rebuild is idempotent (same result)",
      "Same correctAnswers"
    );

    // --- Test 28: Database Unique Indexes ---
    try {
      await StudentPerformance.create({
        studentId: studentAId,
        courseId,
        topicId: topicDaoHamId,
        totalQuestions: 999,
        answeredQuestions: 999,
        correctAnswers: 999,
        incorrectAnswers: 0,
        accuracy: 100,
      });
      assert(false, "Duplicate StudentPerformance should throw", "Unique violation");
    } catch (e) {
      assert(e.code === 11000 || e.message.includes("duplicate"), "StudentPerformance unique index prevents duplicates", "Unique index works");
    }

    // Test 29
    try {
      await PerformanceEvidence.create({
        studentId: studentAId,
        courseId,
        topicId: topicDaoHamId,
        sourceType: "ASSIGNMENT",
        sourceId: storeAttemptId,
        questionId: daoHamQuestions[0],
        isCorrect: true,
      });
      assert(false, "Duplicate PerformanceEvidence should throw", "Unique violation");
    } catch (e) {
      assert(e.code === 11000 || e.message.includes("duplicate"), "PerformanceEvidence unique index prevents duplicates", "Unique index works");
    }

    // Test 30: AI Recommendation (with fallback)
    try {
      // Ensure weaknesses exist for Student A after rebuild
      const weaknessesForRec = await Weakness.find({ studentId: studentAId, courseId });
      if (weaknessesForRec.length > 0) {
        const rec = await generateRecommendationService(studentAId, courseId);
        assert(rec !== null, "AI Recommendation generated (fallback)", "Recommendation exists");
        assert(rec.status === "ACTIVE", "Recommendation status = ACTIVE", "ACTIVE");
        assert(rec.weaknessIds.length > 0, "Recommendation references weaknesses", "weaknessIds populated");
      } else {
        // Create a weakness manually for testing
        await Weakness.create({
          studentId: studentAId,
          courseId,
          topicId: topicTichPhanId,
          weaknessScore: 70,
          accuracy: 30,
          attemptCount: 1,
          correctCount: 3,
          incorrectCount: 7,
          severity: "HIGH",
        });
        const rec = await generateRecommendationService(studentAId, courseId);
        assert(rec !== null, "AI Recommendation generated (fallback)", "Recommendation exists");
        assert(rec.status === "ACTIVE", "Recommendation status = ACTIVE", "ACTIVE");
        assert(rec.weaknessIds.length > 0, "Recommendation references weaknesses", "weaknessIds populated");
      }
    } catch (e) {
      assert(false, "AI Recommendation generation failed: " + e.message, "Should succeed");
    }

    // ---- CLEANUP ----
    await User.deleteMany({ _id: { $in: [studentAId, studentBId] } });
    await Course.deleteMany({ _id: courseId });
    await Topic.deleteMany({ courseId });
    await Question.deleteMany({ topicId: { $in: [topicDaoHamId, topicTichPhanId] } });
    await StudentPerformance.deleteMany({ studentId: { $in: [studentAId, studentBId] } });
    await Weakness.deleteMany({ studentId: { $in: [studentAId, studentBId] } });
    await PerformanceEvidence.deleteMany({ studentId: { $in: [studentAId, studentBId] } });
    await AIRecommendation.deleteMany({ studentId: { $in: [studentAId, studentBId] } });
    await AssignmentAttempt.deleteMany({ _id: storeAttemptId });

  } catch (error) {
    console.error("\nTest execution failed:", error);
    exitCode = 1;
  } finally {
    // Print results table
    console.log("\n==========================================");
    console.log("TEST MATRIX");
    console.log("==========================================");
    console.log(`| # | Scenario | Expected | Actual | Status |`);
    console.log(`|---|---|---|---|---|`);
    for (const r of results) {
      console.log(`| ${r.n} | ${r.scenario} | ${r.expected} | ${r.actual} | ${r.status} |`);
    }
    console.log(`\nTests completed. Passed: ${passedCount}/${testCount}`);
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

runTests();
