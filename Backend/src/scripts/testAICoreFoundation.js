import mongoose from "mongoose";
import dotenv from "dotenv";
import { AIError, AIErrorCode } from "../utils/aiError.js";
import { MockAIProvider } from "../ai/providers/mock.provider.js";
import promptManager from "../ai/prompts/promptManager.js";
import {
  cleanJsonString,
  safeParseJSON,
  validateSummaryOutput,
  validateExamOutput,
  validateGradingOutput,
} from "../ai/parsers/outputParser.js";
import aiCoreService from "../ai/services/aiCore.service.js";
import aiUsageService from "../ai/services/aiUsage.service.js";

dotenv.config();

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING SPRINT 1 — AI CORE FOUNDATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    // TEST 1: AIError & Error Codes
    console.log("1. Testing AIError Utility:");
    const err = new AIError("Lỗi kết nối AI", AIErrorCode.AI_PROVIDER_ERROR, 502, { detail: "test" });
    assert(err.isAIError === true, "AIError has isAIError = true");
    assert(err.code === "AI_PROVIDER_ERROR", "AIError retains code");
    assert(err.status === 502, "AIError retains status code");

    // TEST 2: Mock AI Provider
    console.log("\n2. Testing Mock AI Provider:");
    const mockProvider = new MockAIProvider();
    const textRes = await mockProvider.generateText({ prompt: "Xin chào" });
    assert(textRes && textRes.text.length > 0, "Mock provider generateText returns string");
    assert(textRes.inputTokens > 0, "Mock provider returns token count");

    const jsonRes = await mockProvider.generateJSON({ prompt: "summary bài giảng" });
    assert(jsonRes && typeof jsonRes.data === "object", "Mock provider generateJSON returns object");
    assert(jsonRes.data.summary !== undefined, "Mock provider summary response has expected field");

    // TEST 3: Prompt Manager
    console.log("\n3. Testing Prompt Manager:");
    const summaryPrompt = promptManager.build("summary", { contentText: "Nội dung Bài 1" });
    assert(summaryPrompt.name === "summary", "PromptManager builds summary prompt template");
    assert(summaryPrompt.prompt.includes("Bài 1"), "Prompt incorporates variables correctly");

    const examPrompt = promptManager.build("exam", { topic: "Toán 12", mcqCount: 2, essayCount: 1 });
    assert(examPrompt.name === "exam", "PromptManager builds exam prompt template");
    assert(examPrompt.prompt.includes("Toán 12"), "Exam prompt contains topic");

    // TEST 4: Output Parser & Cleaning
    console.log("\n4. Testing Output Parser & Cleaning:");
    const markdownJson = "```json\n{\"summary\": \"Tóm tắt mẫu\", \"keyPoints\": [\"Ý 1\"]}\n```";
    const cleaned = cleanJsonString(markdownJson);
    assert(cleaned.startsWith("{") && cleaned.endsWith("}"), "cleanJsonString strips markdown fences");

    const parsed = safeParseJSON(markdownJson);
    assert(parsed.summary === "Tóm tắt mẫu", "safeParseJSON parses markdown JSON");

    const validatedSummary = validateSummaryOutput(parsed);
    assert(validatedSummary.summary === "Tóm tắt mẫu", "validateSummaryOutput validates fields");
    assert(Array.isArray(validatedSummary.keyPoints), "validateSummaryOutput returns array keyPoints");

    // TEST 5: Exam Output Validation
    console.log("\n5. Testing Exam Output Validation:");
    const mockExamJson = {
      title: "Đề thi mẫu",
      questions: [
        {
          type: "multiple_choice",
          content: "1 + 1 = ?",
          options: [{ id: "opt_1", text: "2" }, { id: "opt_2", text: "3" }],
          correctAnswer: "opt_1",
          points: 5.0,
        },
        {
          type: "essay",
          content: "Giải thích khái niệm X",
          points: 5.0,
        },
      ],
    };
    const validatedExam = validateExamOutput(mockExamJson);
    assert(validatedExam.questions.length === 2, "validateExamOutput returns 2 questions");
    assert(validatedExam.totalPoints === 10.0, "validateExamOutput calculates totalPoints");

    // TEST 6: Grading Output Validation
    console.log("\n6. Testing Grading Output Validation:");
    const mockGradingJson = {
      suggestedScore: 8.5,
      confidence: 0.9,
      aiFeedback: "Bài làm tốt",
    };
    const validatedGrading = validateGradingOutput(mockGradingJson, 10.0);
    assert(validatedGrading.suggestedScore === 8.5, "validateGradingOutput validates suggestedScore");
    assert(validatedGrading.confidence === 0.9, "validateGradingOutput validates confidence");

    // TEST 7: AI Core Service with Mock Provider
    console.log("\n7. Testing AICoreService Execution:");
    process.env.AI_MOCK_MODE = "true";
    const dummyUserId = new mongoose.Types.ObjectId();

    // Mock DB functions if not connected to MongoDB
    aiUsageService.checkUserQuota = async () => ({
      allowed: true,
      remaining: 99,
      dailyLimit: 100,
      config: { isGloballyEnabled: true, defaultProvider: "mock", featureFlags: { summary: true } },
    });
    aiUsageService.recordUsage = async () => {};
    aiUsageService.reserveQuota = async () => new mongoose.Types.ObjectId();
    aiUsageService.finalizeUsage = async () => {};

    const coreResult = await aiCoreService.executeStructuredAI({
      userId: dummyUserId,
      userRole: "teacher",
      feature: "summary",
      templateName: "summary",
      promptParams: { title: "Bài học 1", contentText: "Nội dung bài học" },
      validatorFunc: validateSummaryOutput,
    });

    assert(coreResult && coreResult.data && coreResult.data.summary !== undefined, "executeStructuredAI returns validated data");
    assert(coreResult.usage && coreResult.usage.provider === "mock", "executeStructuredAI uses Mock Provider in mock mode");

  } catch (error) {
    console.error("❌ Exception during test execution:", error);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
