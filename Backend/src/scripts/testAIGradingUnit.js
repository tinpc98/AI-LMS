import mongoose from "mongoose";
import ExamAttempt from "../models/examAttempt.model.js";
import AIGradingSuggestion from "../models/aiGradingSuggestion.model.js";
import aiGradingService from "../ai/services/aiGrading.service.js";
import aiCoreService from "../ai/services/aiCore.service.js";

const runTests = async () => {
  console.log("==========================================");
  console.log("🧪 BẮT ĐẦU UNIT TEST: AI GRADING MOCK");
  console.log("==========================================\n");

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

  try {
    ExamAttempt.findById = () => ({
      populate: () => Promise.resolve(mockAttempt)
    });
    
    // Mock AI Core Service
    aiCoreService.processAIRequest = async (userId, userRole, feature, processor) => {
      return {
        usageId: new mongoose.Types.ObjectId(),
        model: "mock-model",
        rawText: JSON.stringify({
          suggestedScore: 8.5,
          confidence: 0.95,
          aiFeedback: "Bài làm tốt",
          criterionScores: [
            { criterion: "Nội dung", scoreEarned: 5, maxScore: 6, feedback: "ok" }
          ],
          warnings: []
        })
      };
    };

    let savedSuggestion = null;
    AIGradingSuggestion.findOne = () => Promise.resolve(null);
    AIGradingSuggestion.prototype.save = function() {
      savedSuggestion = this;
      return Promise.resolve();
    };

    // Gọi hàm generate
    const suggestion = await aiGradingService.generateGradeSuggestion({
      attemptId: mockAttemptId,
      questionId: mockSnapshotQuestionId,
      teacherId: mockTeacherId
    });

    assertEqual("Test 1: Generates suggestion successfully", suggestion !== null, true);
    assertEqual("Test 2: Suggested score is 8.5 (from Mock)", suggestion.suggestedScore, 8.5);
    assertEqual("Test 3: Contains criterionScores", suggestion.criterionScores.length > 0, true);
    assertEqual("Test 4: Status is PENDING_REVIEW", suggestion.status, "PENDING_REVIEW");

    // Test confirmGradeSuggestion
    AIGradingSuggestion.findById = () => Promise.resolve(savedSuggestion);

    const result = await aiGradingService.confirmGradeSuggestion({
      suggestionId: new mongoose.Types.ObjectId(),
      action: "accept",
      finalScore: 9, // Teacher overrides to 9
      teacherFeedback: "Tốt lắm",
      teacherId: mockTeacherId
    });

    assertEqual("Test 5: Confirms successfully", result.status, "ACCEPTED");
    assertEqual("Test 6: Updates examAttempt score", mockAttempt.answers[0].pointsEarned, 9);
    assertEqual("Test 7: Appends teacher feedback", mockAttempt.answers[0].essayText.includes("Tốt lắm"), true);

  } catch (error) {
    console.error("❌ FAIL: Threw error", error);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`🎯 KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log("==========================================\n");

  if (failed > 0) process.exit(1);
  process.exit(0);
};

runTests();
