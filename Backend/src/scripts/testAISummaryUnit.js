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

  const fs = await import("fs");
  const path = await import("path");
  const fixturePath = (filename) => path.join(process.cwd(), "src", "scripts", "fixtures", filename);

  await runTest("Extractor: PDF thật hợp lệ trích xuất được text", async () => {
    const buf = fs.readFileSync(fixturePath("valid-summary.pdf"));
    const text = await lessonContentExtractor.extractPdf(buf);
    assert.ok(text.includes("Hello World"), "Text extracted from PDF");
  });

  await runTest("Extractor: DOCX thật hợp lệ trích xuất được text", async () => {
    const buf = fs.readFileSync(fixturePath("valid-summary.docx"));
    const text = await lessonContentExtractor.extractDocx(buf);
    assert.ok(text.includes("Hello DOCX"), "Text extracted from DOCX");
  });

  await runTest("Extractor: Lỗi phân tích file PDF hỏng (AIError mapping)", async () => {
    try {
      const buf = fs.readFileSync(fixturePath("corrupted.pdf"));
      await lessonContentExtractor.extractPdf(buf);
      assert.fail("Nên throw lỗi khi parse PDF hỏng");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  await runTest("Extractor: Lỗi phân tích file DOCX hỏng", async () => {
    try {
      const buf = fs.readFileSync(fixturePath("corrupted.docx"));
      await lessonContentExtractor.extractDocx(buf);
      assert.fail("Nên throw lỗi khi parse DOCX hỏng");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  await runTest("Extractor: PDF buffer rỗng trả 415", async () => {
    try {
      await lessonContentExtractor.extractPdf(Buffer.from(""));
      assert.fail("Nên throw lỗi");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  await runTest("Extractor: DOCX buffer rỗng trả 415", async () => {
    try {
      await lessonContentExtractor.extractDocx(Buffer.from(""));
      assert.fail("Nên throw lỗi");
    } catch (err) {
      assert.strictEqual(err.code, "AI_INVALID_INPUT");
      assert.strictEqual(err.status, 415);
    }
  });

  // 3. Router Tests
  await runTest("Router: Load thành công không lỗi (không dùng cookie-express)", async () => {
    const routerModule = await import("../routes/aiSummary.routes.js");
    assert.ok(routerModule.default, "Router loaded");
  });

  // 4. Controller & IDOR Tests (Mocking)
  await runTest("Controller: Truyền lessonId và IDOR bắt được", async () => {
    const aiSummaryController = (await import("../controllers/aiSummary.controller.js")).default;
    const aiSummaryService = (await import("../ai/services/aiSummary.service.js")).default;
    
    let findOneParams = null;
    
    // Mock Service function
    const originalApprove = aiSummaryService.approveSummary;
    try {
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

      await aiSummaryController.approveSummary(req, res);

      assert.strictEqual(findOneParams.lessonId, "L1", "lessonId phải được truyền xuống service");
      assert.strictEqual(findOneParams.summaryId, "S1", "summaryId phải được truyền xuống service");
    } finally {
      aiSummaryService.approveSummary = originalApprove;
    }
  });

  await runTest("IDOR: approveSummary chặn truy cập chéo bài học (Cross-Lesson IDOR)", async () => {
    const aiSummaryService = (await import("../ai/services/aiSummary.service.js")).default;
    const mongoose = (await import("mongoose")).default;
    const AISummary = (await import("../models/aiSummary.model.js")).default;
    const Lesson = (await import("../models/lesson.model.js")).default;
    
    // Mock mongoose startSession
    const originalStartSession = mongoose.startSession;
    let endSessionCalled = false;
    mongoose.startSession = async () => ({
      withTransaction: async (cb) => cb(),
      endSession: () => { endSessionCalled = true; }
    });

    // Mock AISummary.findOne to simulate cross-lesson
    const originalFindOne = AISummary.findOne;
    let findOneQuery = null;
    AISummary.findOne = (query) => {
      findOneQuery = query;
      // Trả về null nếu lessonId không khớp (mô phỏng db behavior)
      return { session: () => null }; 
    };

    const originalSave = AISummary.prototype.save;
    let saveCalled = false;
    AISummary.prototype.save = async function() { saveCalled = true; };

    const originalUpdateMany = Lesson.updateMany;
    let updateManyCalled = false;
    Lesson.updateMany = async () => { updateManyCalled = true; };

    try {
      await aiSummaryService.approveSummary("lesson_A", "summary_B", "teacher1");
      assert.fail("Phải throw lỗi");
    } catch (error) {
      assert.strictEqual(error.status, 404);
      assert.strictEqual(findOneQuery.lessonId, "lesson_A");
      assert.strictEqual(findOneQuery._id, "summary_B");
      assert.strictEqual(saveCalled, false, "Không được gọi save() khi lỗi 404");
      assert.strictEqual(updateManyCalled, false, "Không được gọi updateMany() khi lỗi 404");
      assert.strictEqual(endSessionCalled, true, "Phải gọi endSession()");
    } finally {
      mongoose.startSession = originalStartSession;
      AISummary.findOne = originalFindOne;
      AISummary.prototype.save = originalSave;
      Lesson.updateMany = originalUpdateMany;
    }
  });

  await runTest("IDOR: rejectSummary chặn truy cập chéo bài học (Cross-Lesson IDOR)", async () => {
    const aiSummaryService = (await import("../ai/services/aiSummary.service.js")).default;
    const mongoose = (await import("mongoose")).default;
    const AISummary = (await import("../models/aiSummary.model.js")).default;
    const Lesson = (await import("../models/lesson.model.js")).default;
    
    // Mock mongoose startSession
    const originalStartSession = mongoose.startSession;
    let endSessionCalled = false;
    mongoose.startSession = async () => ({
      withTransaction: async (cb) => cb(),
      endSession: () => { endSessionCalled = true; }
    });

    // Mock AISummary.findOne to simulate cross-lesson
    const originalFindOne = AISummary.findOne;
    let findOneQuery = null;
    AISummary.findOne = (query) => {
      findOneQuery = query;
      return { session: () => null }; 
    };

    const originalSave = AISummary.prototype.save;
    let saveCalled = false;
    AISummary.prototype.save = async function() { saveCalled = true; };

    const originalUpdateMany = Lesson.updateMany;
    let updateManyCalled = false;
    Lesson.updateMany = async () => { updateManyCalled = true; };

    try {
      await aiSummaryService.rejectSummary("lesson_A", "summary_B", "teacher1", "Lý do");
      assert.fail("Phải throw lỗi");
    } catch (error) {
      assert.strictEqual(error.status, 404);
      assert.strictEqual(findOneQuery.lessonId, "lesson_A");
      assert.strictEqual(findOneQuery._id, "summary_B");
      assert.strictEqual(saveCalled, false, "Không được gọi save() khi lỗi 404");
      assert.strictEqual(updateManyCalled, false, "Không được gọi updateMany() khi lỗi 404");
      assert.strictEqual(endSessionCalled, true, "Phải gọi endSession()");
    } finally {
      mongoose.startSession = originalStartSession;
      AISummary.findOne = originalFindOne;
      AISummary.prototype.save = originalSave;
      Lesson.updateMany = originalUpdateMany;
    }
  });

  console.log(`\n🏁 Kết quả Unit Test: ${passed} PASS, ${failed} FAIL`);
  process.exitCode = failed > 0 ? 1 : 0;
}

runUnitTests();
