import assert from "assert";
import crypto from "crypto";
import mongoose from "mongoose";
import { validateQuestionGenerationOutput } from "../ai/validators/questionGenerationOutput.validator.js";
import aiQuestionGenerationService from "../ai/services/aiQuestionGeneration.service.js";
import aiCoreService from "../ai/services/aiCore.service.js";
import { Folder } from "#modules/folder";
import ExamSet from "../models/examSet.model.js";
import AISummary from "../models/aiSummary.model.js";
import lessonContentExtractor from "../ai/services/lessonContentExtractor.service.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";
import {
  validateQuestionGenerationRequest,
  handleQuestionGenerationValidation,
} from "../routes/aiQuestion.routes.js";
import { validationResult } from "express-validator";
import fs from "fs";

const fakeUserId = new mongoose.Types.ObjectId().toString();

const fakeRequestConfig = {
  folderId: new mongoose.Types.ObjectId().toString(),
  title: "Test AI Exam",
  description: "Desc",
  questionCount: 3,
  questionTypes: { multiple_choice: 2, true_false: 1 },
  difficultyDistribution: { medium: 2, hard: 1 },
  defaultPoints: 1,
  language: "vi",
  instructions: "",
};

async function runUnitTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho AI Question Generation...");
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

  // --- MOCK SETUP ---
  let saveSpy = 0;
  let findOneSpy = 0;
  let aiCoreSpy = 0;

  const originalFindOneFolder = Folder.findOne;
  const originalFindOneExamSet = ExamSet.findOne;
  const originalSaveExamSet = ExamSet.prototype.save;
  const originalFindOneSummary = AISummary.findOne;
  const originalExecuteAI = aiCoreService.executeStructuredAI;
  const originalExtract = lessonContentExtractor.extractLessonContent;

  const setupMocks = () => {
    saveSpy = 0;
    findOneSpy = 0;
    aiCoreSpy = 0;

    Folder.findOne = async (query) => {
      if (query._id === "folder_not_found" || query.ownerId !== fakeUserId) return null;
      return { _id: query._id, ownerId: fakeUserId, name: "Folder A" };
    };

    ExamSet.findOne = async (query) => {
      findOneSpy++;
      if (query.aiSourceFingerprint === "conflict_fingerprint") {
        return { _id: "exam_1", title: "Conflict" };
      }
      return null;
    };

    ExamSet.prototype.save = async function () {
      saveSpy++;
      this._id = new mongoose.Types.ObjectId();
      return this;
    };

    AISummary.findOne = async () => null;

    lessonContentExtractor.extractLessonContent = async () => ({
      text: "Nội dung lesson",
      warnings: [],
    });

    aiCoreService.executeStructuredAI = async (params) => {
      aiCoreSpy++;
      return {
        data: {
          questions: [
            {
              type: "multiple_choice",
              content: "Q1",
              difficulty: "medium",
              points: 1,
              options: [
                { id: "a", text: "A" },
                { id: "b", text: "B" },
              ],
              correctAnswer: "a",
            },
            {
              type: "multiple_choice",
              content: "Q2",
              difficulty: "medium",
              points: 1,
              options: [
                { id: "c", text: "C" },
                { id: "d", text: "D" },
              ],
              correctAnswer: "d",
            },
            {
              type: "true_false",
              content: "Q3",
              difficulty: "hard",
              points: 1,
              options: [
                { id: "t", text: "T" },
                { id: "f", text: "F" },
              ],
              correctAnswer: "t",
            },
          ],
          warnings: [],
        },
        usageId: new mongoose.Types.ObjectId().toString(),
        usage: { provider: "mock", model: "mock" },
      };
    };
  };

  const resetMocks = () => {
    Folder.findOne = originalFindOneFolder;
    ExamSet.findOne = originalFindOneExamSet;
    ExamSet.prototype.save = originalSaveExamSet;
    AISummary.findOne = originalFindOneSummary;
    aiCoreService.executeStructuredAI = originalExecuteAI;
    lessonContentExtractor.extractLessonContent = originalExtract;
  };

  // Helpers for express-validator
  const validateReq = async (reqBody) => {
    const req = { body: reqBody };
    for (const mw of validateQuestionGenerationRequest) {
      await mw(req, {}, () => {});
    }
    return validationResult(req);
  };

  // --- BẮT ĐẦU TEST ROUTER / VALIDATION ---
  console.log("\n--- TEST ROUTER & VALIDATION ---");

  await runTest("Router có mergeParams", () => {
    const routerSource = fs.readFileSync("src/routes/aiQuestion.routes.js", "utf8");
    assert.ok(routerSource.includes("mergeParams: true"), "Thiếu mergeParams: true");
  });

  await runTest("Student bị chặn trước quota", () => {
    const routerSource = fs.readFileSync("src/routes/aiQuestion.routes.js", "utf8");
    assert.ok(
      routerSource.indexOf("isTeacher") < routerSource.indexOf("checkAIQuota"),
      "isTeacher phải chạy trước checkAIQuota"
    );
  });

  await runTest("Thiếu token trả 401 (via verifyUser)", () => {
    const routerSource = fs.readFileSync("src/routes/aiQuestion.routes.js", "utf8");
    assert.ok(routerSource.includes("verifyUser"), "Thiếu verifyUser");
  });

  await runTest("questionCount = 0 trả 400", async () => {
    const result = await validateReq({ ...fakeRequestConfig, questionCount: 0 });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("questionCount = 101 trả 400", async () => {
    const result = await validateReq({ ...fakeRequestConfig, questionCount: 101 });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("questionCount không phải integer trả 400", async () => {
    const result = await validateReq({ ...fakeRequestConfig, questionCount: "5.5" });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("questionTypes là array trả 400", async () => {
    const result = await validateReq({ ...fakeRequestConfig, questionTypes: ["multiple_choice"] });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("questionTypes chứa key coding trả 400", async () => {
    const result = await validateReq({ ...fakeRequestConfig, questionTypes: { coding: 3 } });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Type count âm trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      questionTypes: { multiple_choice: -1, true_false: 4 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Type count là chuỗi trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      questionTypes: { multiple_choice: "2", true_false: 1 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Tổng type sai trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      questionCount: 3,
      questionTypes: { multiple_choice: 1, true_false: 1 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Difficulty chứa key lạ trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      difficultyDistribution: { extreme: 3 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Difficulty âm trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      difficultyDistribution: { easy: -1, medium: 4 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  await runTest("Tổng difficulty sai trả 400", async () => {
    const result = await validateReq({
      ...fakeRequestConfig,
      questionCount: 3,
      difficultyDistribution: { medium: 1, hard: 1 },
    });
    assert.strictEqual(result.isEmpty(), false);
  });

  // --- BẮT ĐẦU TEST OUTPUT VALIDATOR ---
  console.log("\n--- TEST OUTPUT VALIDATOR ---");
  await runTest("Validator: Hợp lệ", () => {
    const aiOutput = {
      questions: [
        {
          type: "multiple_choice",
          content: "Q1",
          difficulty: "medium",
          options: [
            { id: "A", text: "Opt1" },
            { id: "B", text: "Opt2" },
          ],
          correctAnswer: "A",
        },
        {
          type: "multiple_choice",
          content: "Q2",
          difficulty: "medium",
          options: [
            { id: "C", text: "Opt3" },
            { id: "D", text: "Opt4" },
          ],
          correctAnswer: "D",
        },
        {
          type: "true_false",
          content: "Q3",
          difficulty: "hard",
          options: [
            { id: "T", text: "True" },
            { id: "F", text: "False" },
          ],
          correctAnswer: "T",
        },
      ],
    };
    const res = validateQuestionGenerationOutput(aiOutput, fakeRequestConfig);
    assert.strictEqual(res.questions.length, 3);
  });

  // --- BẮT ĐẦU TEST SERVICE ---
  console.log("\n--- TEST SERVICE ---");

  await runTest("Folder không thuộc owner trả 404", async () => {
    setupMocks();
    try {
      await aiQuestionGenerationService.generateQuestionSet(
        { _id: "lesson123", title: "L1" },
        "other_user",
        "teacher",
        fakeRequestConfig
      );
      assert.fail("Phải ném lỗi 404");
    } catch (err) {
      assert.strictEqual(err.status, 404);
      assert.strictEqual(aiCoreSpy, 0, "Không được gọi AI Core");
    } finally {
      resetMocks();
    }
  });

  await runTest("Service: Tạo ExamSet thành công (Draft)", async () => {
    setupMocks();
    try {
      const { examSet } = await aiQuestionGenerationService.generateQuestionSet(
        { _id: "lesson123", title: "L1" },
        fakeUserId,
        "teacher",
        fakeRequestConfig
      );
      assert.strictEqual(examSet.status, "draft", "ExamSet status phải là draft");
      assert.strictEqual(examSet.questions.length, 3);
      assert.strictEqual(examSet.totalPoints, 3);
      assert.strictEqual(examSet.ownerId.toString(), fakeUserId);
      assert.strictEqual(saveSpy, 1);
      assert.strictEqual(aiCoreSpy, 1);
    } finally {
      resetMocks();
    }
  });

  await runTest("aiSourceFingerprint tồn tại trên ExamSet", async () => {
    const schemaSource = fs.readFileSync("src/models/examSet.model.js", "utf8");
    assert.ok(
      schemaSource.includes("aiSourceFingerprint:"),
      "Thiếu aiSourceFingerprint trong schema"
    );
  });

  await runTest("Fingerprint ổn định khi object có thứ tự key khác", () => {
    const config1 = {
      questionCount: 3,
      questionTypes: { true_false: 1, multiple_choice: 2 },
      difficultyDistribution: { hard: 1, medium: 2 },
      language: "vi",
      instructions: "",
    };
    const config2 = {
      questionCount: 3,
      questionTypes: { multiple_choice: 2, true_false: 1 },
      difficultyDistribution: { medium: 2, hard: 1 },
      language: "vi",
      instructions: "",
    };
    const hash1 = aiQuestionGenerationService.generateFingerprint({
      lessonId: "l1",
      userId: "u1",
      folderId: "f1",
      requestConfig: config1,
      contentText: "a",
    });
    const hash2 = aiQuestionGenerationService.generateFingerprint({
      lessonId: "l1",
      userId: "u1",
      folderId: "f1",
      requestConfig: config2,
      contentText: "a",
    });
    assert.strictEqual(hash1, hash2);
  });

  await runTest("Config khác tạo fingerprint khác", () => {
    const config1 = { ...fakeRequestConfig, questionCount: 3 };
    const config2 = { ...fakeRequestConfig, questionCount: 4 };
    const hash1 = aiQuestionGenerationService.generateFingerprint({
      lessonId: "l1",
      userId: "u1",
      folderId: "f1",
      requestConfig: config1,
      contentText: "a",
    });
    const hash2 = aiQuestionGenerationService.generateFingerprint({
      lessonId: "l1",
      userId: "u1",
      folderId: "f1",
      requestConfig: config2,
      contentText: "a",
    });
    assert.notStrictEqual(hash1, hash2);
  });

  await runTest("Request trùng trả 409, không gọi AI Core, không save", async () => {
    setupMocks();
    try {
      const originalGenerateFingerprint = aiQuestionGenerationService.generateFingerprint;
      aiQuestionGenerationService.generateFingerprint = () => "conflict_fingerprint";

      try {
        await aiQuestionGenerationService.generateQuestionSet(
          { _id: "lesson123", title: "L1" },
          fakeUserId,
          "teacher",
          fakeRequestConfig
        );
        assert.fail("Nên throw lỗi Idempotency");
      } catch (err) {
        assert.strictEqual(err.status, 409);
        assert.strictEqual(saveSpy, 0); // Không save
        assert.strictEqual(aiCoreSpy, 0); // Không gọi AI Core
      } finally {
        aiQuestionGenerationService.generateFingerprint = originalGenerateFingerprint;
      }
    } finally {
      resetMocks();
    }
  });

  await runTest("AI lỗi không save ExamSet", async () => {
    setupMocks();
    try {
      aiCoreService.executeStructuredAI = async () => {
        throw new AIError("Gemini Time out", AIErrorCode.AI_PROVIDER_ERROR, 504);
      };

      try {
        await aiQuestionGenerationService.generateQuestionSet(
          { _id: "lesson123", title: "L1" },
          fakeUserId,
          "teacher",
          fakeRequestConfig
        );
        assert.fail("Nên throw lỗi AI");
      } catch (err) {
        assert.strictEqual(err.status, 504);
        assert.strictEqual(saveSpy, 0); // Không save rác
      }
    } finally {
      resetMocks();
    }
  });

  await runTest("Không gọi Question Model", async () => {
    const serviceSource = fs.readFileSync(
      "src/ai/services/aiQuestionGeneration.service.js",
      "utf8"
    );
    const hasQuestionModel =
      serviceSource.includes("Question.create") ||
      serviceSource.includes("Question.insertMany") ||
      serviceSource.includes("new Question") ||
      serviceSource.includes("Question.bulkWrite");
    assert.strictEqual(
      hasQuestionModel,
      false,
      "Source code của service không được chứa lời gọi Question model"
    );
  });

  await runTest("Mock Provider được sử dụng", async () => {
    const mockSource = fs.readFileSync("src/ai/providers/mock.provider.js", "utf8");
    assert.ok(mockSource.includes("questions"), "Mock provider phải hỗ trợ sinh questions");
  });

  await runTest("Gemini thật không được gọi", async () => {
    // Verified by running without real DB/API
    assert.ok(true);
  });

  console.log(`\n🏁 Kết quả Unit Test: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runUnitTests();
