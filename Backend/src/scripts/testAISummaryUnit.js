import assert from "assert";
import { summaryOutputValidator } from "../ai/validators/summaryOutput.validator.js";
import lessonContentExtractor from "../ai/services/lessonContentExtractor.service.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";

async function runUnitTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho AI Summary...");
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

  // 1. Validator Tests
  await runTest("Validator: Output hợp lệ", () => {
    const data = {
      summary: "Đây là tóm tắt",
      keyPoints: ["Điểm 1", " Điểm 2 "],
      suggestedReviewTopics: ["Chủ đề 1"]
    };
    const res = summaryOutputValidator(data);
    assert.strictEqual(res.keyPoints[1], "Điểm 2", "Keypoint phải được trim");
  });

  await runTest("Validator: Thiếu summary", () => {
    const data = { keyPoints: ["Điểm 1"] };
    assert.throws(() => summaryOutputValidator(data), /bị thiếu hoặc rỗng/);
  });

  await runTest("Validator: Mảng keyPoints rỗng", () => {
    const data = { summary: "Tóm tắt", keyPoints: [] };
    assert.throws(() => summaryOutputValidator(data), /không được rỗng/);
  });

  await runTest("Validator: Lọc phần tử rỗng trong mảng", () => {
    const data = {
      summary: "Tóm tắt",
      keyPoints: ["Điểm 1", "  ", ""],
      suggestedReviewTopics: ["", "Topic 1"]
    };
    const res = summaryOutputValidator(data);
    assert.strictEqual(res.keyPoints.length, 1);
    assert.strictEqual(res.suggestedReviewTopics.length, 1);
  });

  // 2. Extractor Tests
  await runTest("Extractor: Chặn URL không an toàn", () => {
    assert.strictEqual(lessonContentExtractor.isUrlAllowed("http://res.cloudinary.com/test"), false); // HTTP
    assert.strictEqual(lessonContentExtractor.isUrlAllowed("https://hacker.com/file.pdf"), false); // Not in allowed domains
    assert.strictEqual(lessonContentExtractor.isUrlAllowed("https://res.cloudinary.com/test"), true); // OK
  });

  await runTest("Extractor: Clean text filter null characters", () => {
    const badText = "Hello\x00World\x0B!";
    const cleaned = lessonContentExtractor.cleanText(badText);
    assert.strictEqual(cleaned, "HelloWorld!");
  });

  await runTest("Extractor: Lỗi phân tích file DOCX hỏng", async () => {
    try {
      await lessonContentExtractor.extractDocx(Buffer.from("Fake DOCX content"));
      assert.fail("Nên throw lỗi khi parse DOCX hỏng");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  await runTest("Extractor: Lỗi phân tích file PDF hỏng (AIError mapping)", async () => {
    try {
      await lessonContentExtractor.extractPdf(Buffer.from("Fake PDF content"));
      assert.fail("Nên throw lỗi khi parse PDF hỏng");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  // 3. Router Tests
  await runTest("Router: Load thành công không lỗi (không dùng cookie-express)", async () => {
    const routerModule = await import("../routers/aiSummary.routes.js");
    assert.ok(routerModule.default, "Router loaded");
  });

  // 4. Controller & IDOR Tests (Mocking)
  await runTest("Controller: Truyền lessonId và IDOR bắt được", async () => {
    const aiSummaryController = (await import("../controllers/aiSummary.controller.js")).default;
    const aiSummaryService = (await import("../ai/services/aiSummary.service.js")).default;
    
    let findOneParams = null;
    
    // Mock Service function
    const originalApprove = aiSummaryService.approveSummary;
    aiSummaryService.approveSummary = async (lessonId, summaryId, userId) => {
      findOneParams = { lessonId, summaryId };
      throw new AIError("Mock Error", "MOCK", 400); // Stop execution
    };

    const req = {
      params: { lessonId: "L1", summaryId: "S1" },
      user: { id: "U1" }
    };
    const res = {
      status: (code) => ({ json: (data) => ({ code, data }) })
    };

    const result = await aiSummaryController.approveSummary(req, res);
    
    // Restore
    aiSummaryService.approveSummary = originalApprove;

    assert.strictEqual(findOneParams.lessonId, "L1", "lessonId phải được truyền xuống service");
    assert.strictEqual(findOneParams.summaryId, "S1", "summaryId phải được truyền xuống service");
  });

  console.log(`\n🏁 Kết quả Unit Test: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
}

runUnitTests();
