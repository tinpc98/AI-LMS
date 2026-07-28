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

  console.log(`\n🏁 Kết quả Unit Test: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) process.exit(1);
}

runUnitTests();
