import "dotenv/config";
import fs from "fs";
import { GeminiAIProvider } from "../ai/providers/gemini.provider.js";
import { AIErrorCode } from "../utils/aiError.js";

async function runUnitTests() {
  console.log("==================================================");
  console.log("BẮT ĐẦU UNIT TEST: GEMINI PROVIDER (MOCK SDK)");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  const provider = new GeminiAIProvider("dummy_key", "dummy-model");

  // Helper to mock generateContent
  const mockGenerateContent = (mockResponse, mockError) => {
    provider.ai.models.generateContent = async (req) => {
      // assert config is passed correctly
      if (req.config && req.config.responseJsonSchema) {
        provider.__lastRequestSchema = req.config.responseJsonSchema;
      }
      if (mockError) throw mockError;
      return mockResponse;
    };
  };

  try {
    // 1 & 2. Response text rỗng / khoảng trắng
    console.log("\n1. Test Response Text Rỗng & Khoảng trắng");
    mockGenerateContent({ text: "   ", candidates: [{ finishReason: "STOP" }] });
    try {
      await provider.generateJSON({ prompt: "test" });
      assert(false, "Không ném lỗi khi response rỗng");
    } catch (e) {
      assert(e.code === AIErrorCode.AI_PROVIDER_ERROR, "Ném lỗi AI_PROVIDER_ERROR khi rỗng");
      assert(e.message.includes("Gemini không trả về nội dung"), "Báo lỗi response rỗng");
    }

    // 3. JSON hợp lệ
    console.log("\n2. Test JSON Hợp Lệ");
    mockGenerateContent({ text: '{"key": "value"}', candidates: [{ finishReason: "STOP" }] });
    const res3 = await provider.generateJSON({ prompt: "test" });
    assert(res3.data.key === "value", "Parse JSON hợp lệ thành công");

    // 4. JSON bị cắt
    console.log("\n3. Test JSON Bị Cắt");
    mockGenerateContent({ text: '{"key": "val', candidates: [{ finishReason: "MAX_TOKENS" }] });
    try {
      await provider.generateJSON({ prompt: "test" });
      assert(false, "Không ném lỗi khi JSON bị cắt");
    } catch (e) {
      assert(e.code === AIErrorCode.AI_OUTPUT_INVALID, "Ném lỗi AI_OUTPUT_INVALID");
      assert(e.message.includes("finishReason=MAX_TOKENS"), "Có chứa finishReason MAX_TOKENS");
    }

    // 5 & 6 & 7. finishReason & blockReason
    console.log("\n4. Test Block Reason & Safety");
    mockGenerateContent({ text: null, promptFeedback: { blockReason: "SAFETY" }, candidates: [] });
    try {
      await provider.generateJSON({ prompt: "test" });
    } catch (e) {
      assert(e.message.includes("blockReason=SAFETY"), "Đọc được blockReason");
    }

    // 8. RESOURCE_EXHAUSTED
    console.log("\n5. Test Quota / Rate Limit");
    mockGenerateContent(null, new Error("RESOURCE_EXHAUSTED"));
    try {
      await provider.generateJSON({ prompt: "test" });
    } catch (e) {
      assert(e.code === AIErrorCode.AI_QUOTA_EXCEEDED, "Bắt được lỗi Quota (429)");
    }

    // 9. Timeout (Mock Promise không resolve)
    console.log("\n6. Test Timeout");
    provider.ai.models.generateContent = () => new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      await provider.generateJSON({ prompt: "test", timeoutMs: 50 });
      assert(false, "Không ném lỗi timeout");
    } catch (e) {
      assert(e.code === AIErrorCode.AI_TIMEOUT, "Bắt được lỗi Timeout (504)");
    }

    // 10 & 11. API key không hợp lệ
    console.log("\n7. Test Auth Lỗi & Không Log Key");
    mockGenerateContent(null, new Error("UNAUTHENTICATED"));
    try {
      await provider.generateJSON({ prompt: "test" });
    } catch (e) {
      assert(e.code === AIErrorCode.AI_CONFIG_ERROR, "Bắt được lỗi API Key không hợp lệ");
      assert(!e.message.includes("dummy_key"), "Không log giá trị API key trong thông báo lỗi");
    }

    // 15. responseJsonSchema
    console.log("\n8. Test responseJsonSchema property");
    mockGenerateContent({ text: '{"a":1}' });
    await provider.generateJSON({ prompt: "test", responseSchema: { type: "object" } });
    assert(provider.__lastRequestSchema !== undefined, "Truyền responseJsonSchema đúng cách");

    // 13. Smoke script không dùng process.exit()
    console.log("\n9. Test Script Code");
    const smokeContent = fs.readFileSync("src/scripts/testGeminiProviderSmoke.js", "utf8");
    assert(
      !smokeContent.includes("process.exit("),
      "testGeminiProviderSmoke.js không gọi process.exit()"
    );
  } catch (error) {
    console.error("Lỗi không mong muốn trong lúc test:", error);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`KẾT QUẢ: ${passed} PASS | ${failed} FAIL`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runUnitTests();
