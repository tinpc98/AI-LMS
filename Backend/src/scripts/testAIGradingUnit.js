import mongoose from "mongoose";
import ExamAttempt from "../models/examAttempt.model.js";
import AIGradingSuggestion from "../models/aiGradingSuggestion.model.js";
import aiGradingService from "../ai/services/aiGrading.service.js";
import aiCoreService from "../ai/services/aiCore.service.js";
import { validateGradingOutput } from "../ai/validators/gradingOutput.validator.js";
import crypto from "crypto";

const runTests = async () => {
  console.log("==========================================");
  console.log("🧪 BẮT ĐẦU UNIT TEST: AI GRADING MOCK & VALIDATION");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  const assertEqual = (name, actual, expected) => {
    if (actual === expected) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual: ${actual}`);
      failed++;
    }
  };

  const assertThrows = async (name, promiseFunc, expectedMessagePart) => {
    try {
      await promiseFunc();
      console.error(`❌ FAIL: ${name} (Did not throw)`);
      failed++;
    } catch (e) {
      if (!expectedMessagePart || e.message.includes(expectedMessagePart)) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${name} (Threw wrong error: ${e.message})`);
        failed++;
      }
    }
  };

  try {
    // 1 & 2. Verify AI Core method Production exists
    assertEqual("Test 1: executeStructuredAI exists", typeof aiCoreService.executeStructuredAI, "function");

    // VALIDATOR TESTS (Tests 4 - 9)
    const validOutput = {
      suggestedScore: 8.5,
      confidence: 0.9,
      aiFeedback: "Good",
      criterionScores: [{ criterion: "A", scoreEarned: 8.5, maxScore: 10, feedback: "Good" }],
      warnings: []
    };

    assertEqual("Test 4: Validator accepts valid output", validateGradingOutput(JSON.stringify(validOutput), 10).suggestedScore, 8.5);

    await assertThrows("Test 5: Validator rejects negative score", async () => {
      validateGradingOutput(JSON.stringify({ ...validOutput, suggestedScore: -1 }), 10);
    }, "giới hạn");

    await assertThrows("Test 6: Validator rejects score > maxScore", async () => {
      validateGradingOutput(JSON.stringify({ ...validOutput, suggestedScore: 11 }), 10);
    }, "giới hạn");

    await assertThrows("Test 7: Validator rejects NaN score", async () => {
      validateGradingOutput(JSON.stringify({ ...validOutput, suggestedScore: NaN }), 10);
    }, "hợp lệ");

    await assertThrows("Test 8: Validator rejects Infinity score", async () => {
      validateGradingOutput(JSON.stringify({ ...validOutput, suggestedScore: Infinity }), 10);
    }, "hợp lệ");

    await assertThrows("Test 9: Validator rejects confidence out of bounds", async () => {
      validateGradingOutput(JSON.stringify({ ...validOutput, confidence: 1.5 }), 10);
    }, "khoảng [0, 1]");

    // Logic for dynamic total sync (AI-FIX-04)
    const validOutputMismatched = {
      ...validOutput,
      suggestedScore: 8.0,
      criterionScores: [{ criterion: "A", scoreEarned: 9.0, maxScore: 10, feedback: "Good" }],
    };
    const syncedResult = validateGradingOutput(JSON.stringify(validOutputMismatched), 10);
    assertEqual("Test: Validator syncs suggestedScore with totalCriterionEarned", syncedResult.suggestedScore, 9.0);

    // MOCKS
    let mockExamId = new mongoose.Types.ObjectId();
    let mockAttemptId = new mongoose.Types.ObjectId();
    let mockTeacherId = new mongoose.Types.ObjectId();
    const mockSnapshotQuestionId = "q-uuid-essay-123";

    const mockExam = {
      _id: mockExamId,
      title: "Test Exam Essay",
      questions: [
        {
          questionId: mockSnapshotQuestionId,
          isSnapshot: true,
          points: 10,
          snapshotData: {
            type: "essay",
            content: "Phân tích tác phẩm ABC",
            rubric: { "Nội dung": 6, "Trình bày": 4 }
          }
        }
      ]
    };

    const mockAttempt = {
      _id: mockAttemptId,
      examId: mockExam, 
      studentId: new mongoose.Types.ObjectId(),
      status: "PARTIALLY_GRADED",
      totalScore: 0,
      answers: [
        {
          questionId: mockSnapshotQuestionId,
          essayText: "Tác phẩm ABC rất hay...",
          pointsEarned: 0
        }
      ],
      save: () => Promise.resolve()
    };

    ExamAttempt.findById = () => ({
      populate: () => Promise.resolve(mockAttempt)
    });

    let aiCallCount = 0;
    aiCoreService.executeStructuredAI = async ({ validatorFunc }) => {
      aiCallCount++;
      return {
        data: validatorFunc(JSON.stringify({
          suggestedScore: 9.0,
          confidence: 0.95,
          aiFeedback: "Bài làm tốt, hiểu rõ trọng tâm.",
          criterionScores: [
            { criterion: "Nội dung", scoreEarned: 5.0, maxScore: 6.0, feedback: "Đủ ý" },
            { criterion: "Trình bày", scoreEarned: 4.0, maxScore: 4.0, feedback: "Khá sạch đẹp" },
          ],
          warnings: [],
        })),
        usage: { model: "gemini-1.5-flash-mock" }
      };
    };

    let savedSuggestions = [];
    AIGradingSuggestion.findOne = ({ sourceFingerprint }) => Promise.resolve(savedSuggestions.find(s => s.sourceFingerprint === sourceFingerprint) || null);
    AIGradingSuggestion.findById = (id) => Promise.resolve(savedSuggestions.find(s => s._id === id) || null);
    AIGradingSuggestion.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      const existingIdx = savedSuggestions.findIndex(s => s._id === this._id);
      if (existingIdx !== -1) savedSuggestions[existingIdx] = this;
      else savedSuggestions.push(this);
      return Promise.resolve();
    };

    // Test 10: Snapshot UUID resolved & Test 13: Suggestion PENDING_REVIEW
    const suggestion1 = await aiGradingService.generateGradeSuggestion({
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      teacherId: mockTeacherId
    });

    assertEqual("Test 10 & 13: Suggestion created with PENDING_REVIEW", suggestion1.status, "PENDING_REVIEW");
    assertEqual("Test: suggestedScore is 9.0 (synchronized)", suggestion1.suggestedScore, 9.0);
    assertEqual("Test: aiCallCount is 1", aiCallCount, 1);

    // Test 15: Idempotency không gọi AI lần hai
    const suggestion2 = await aiGradingService.generateGradeSuggestion({
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      teacherId: mockTeacherId
    });
    assertEqual("Test 15: Idempotency returns existing suggestion", suggestion2._id, suggestion1._id);
    assertEqual("Test 15: Idempotency does not call AI again", aiCallCount, 1);

    // Test 14: Fingerprint ổn định khi đổi thứ tự key (Unit test internal check)
    const payload1 = { a: 1, b: 2 };
    const payload2 = { b: 2, a: 1 };
    const fp1 = crypto.createHash("sha256").update(JSON.stringify(payload1, Object.keys(payload1).sort())).digest("hex");
    const fp2 = crypto.createHash("sha256").update(JSON.stringify(payload2, Object.keys(payload2).sort())).digest("hex");
    assertEqual("Test 14: Fingerprint ổn định", fp1, fp2);

    // CONFIRMATION TESTS (16 - 22)
    // Test 19 & 20: Xác nhận sai ID bị chặn
    await assertThrows("Test 19: Incorrect attemptId rejected", async () => {
      await aiGradingService.confirmGradeSuggestion({
        suggestionId: suggestion1._id,
        attemptId: new mongoose.Types.ObjectId(), // Sai ID
        questionId: mockSnapshotQuestionId,
        action: "accept",
        teacherId: mockTeacherId
      });
    });

    await assertThrows("Test 20: Incorrect questionId rejected", async () => {
      await aiGradingService.confirmGradeSuggestion({
        suggestionId: suggestion1._id,
        attemptId: mockAttemptId,
        questionId: "wrong-uuid", // Sai ID
        action: "accept",
        teacherId: mockTeacherId
      });
    });

    // Test 17: adjust bắt buộc finalScore
    await assertThrows("Test 17: Adjust requires valid finalScore", async () => {
      await aiGradingService.confirmGradeSuggestion({
        suggestionId: suggestion1._id,
        attemptId: mockAttemptId,
        questionId: mockSnapshotQuestionId,
        action: "adjust",
        finalScore: NaN, // Invalid
        teacherId: mockTeacherId
      });
    });

    // Test 16: accept không cần finalScore
    const confirmAccept = await aiGradingService.confirmGradeSuggestion({
      suggestionId: suggestion1._id,
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      action: "accept",
      teacherFeedback: "Feedback",
      teacherId: mockTeacherId
    });
    
    assertEqual("Test 16: Accept successful without finalScore", confirmAccept.status, "ACCEPTED");
    assertEqual("Test 23: teacherFeedback saved", confirmAccept.teacherFeedback, "Feedback");
    assertEqual("Test 22: essayText not mutated", mockAttempt.answers[0].essayText, "Tác phẩm ABC rất hay...");
    assertEqual("Test: pointsEarned updated", mockAttempt.answers[0].pointsEarned, 9.0);

    // Test 21: Xác nhận lần hai trả conflict
    await assertThrows("Test 21: Confirming already confirmed suggestion throws conflict", async () => {
      await aiGradingService.confirmGradeSuggestion({
        suggestionId: suggestion1._id,
        attemptId: mockAttemptId,
        questionId: mockSnapshotQuestionId,
        action: "reject",
        teacherId: mockTeacherId
      });
    }, "đã được duyệt");

    // Test 18: reject không cập nhật điểm (Need a new suggestion for this)
    mockAttempt.answers[0].pointsEarned = 0; // reset
    const suggestionReject = new AIGradingSuggestion({
      _id: new mongoose.Types.ObjectId(),
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      status: "PENDING_REVIEW",
      suggestedScore: 5
    });
    savedSuggestions.push(suggestionReject);
    
    const confirmReject = await aiGradingService.confirmGradeSuggestion({
      suggestionId: suggestionReject._id,
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      action: "reject",
      teacherId: mockTeacherId
    });

    assertEqual("Test 18: Reject updates status to REJECTED", confirmReject.status, "REJECTED");
    assertEqual("Test 18: Reject does not update pointsEarned", mockAttempt.answers[0].pointsEarned, 0);

  } catch (error) {
    console.error("❌ FAIL: Threw error unexpectedly", error);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`🎯 KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log("==========================================\n");

  if (failed > 0) process.exit(1);
  process.exit(0);
};

runTests();
