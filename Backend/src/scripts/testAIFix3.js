import assert from "assert";
import { GeminiAIProvider } from "../ai/providers/gemini.provider.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";

let pass = 0;
let fail = 0;

function runTest(name, testFn) {
  return Promise.resolve(testFn())
    .then(() => {
      console.log(`[PASS] ${name}`);
      pass++;
    })
    .catch((error) => {
      console.error(`[FAIL] ${name}`);
      console.error(error.message);
      fail++;
    });
}

async function executeTests() {
  // Test 1: 429 Retry
  await runTest("1. Lỗi 429 được retry và thành công ở lần thứ 2", async () => {
    const provider = new GeminiAIProvider("mock_key", "gemini-3.5-flash");
    let attempts = 0;
    
    // Mock sleep to be instant
    const originalSleep = provider.sleep;
    
    // Override the core execution logic to simulate failure then success
    provider.ai = {
      models: {
        generateContent: async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error("429 RESOURCE_EXHAUSTED");
          }
          return {
            text: "success",
            candidates: [{ finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 }
          };
        }
      }
    };

    const res = await provider.generateText({ prompt: "Hello" });
    assert.strictEqual(attempts, 2, "Should attempt exactly twice");
    assert.strictEqual(res.text, "success");
  });

  // Test 2: 400 is not retried
  await runTest("2. Lỗi 400 không được retry", async () => {
    const provider = new GeminiAIProvider("mock_key", "gemini-3.5-flash");
    let attempts = 0;
    
    provider.ai = {
      models: {
        generateContent: async () => {
          attempts++;
          throw new Error("400 INVALID_ARGUMENT");
        }
      }
    };

    try {
      await provider.generateText({ prompt: "Bad Prompt" });
      assert.fail("Should throw immediately");
    } catch (e) {
      assert.strictEqual(attempts, 1, "Should attempt exactly once and not retry");
      assert.strictEqual(e.status, 400);
    }
  });

  console.log(`\nKết quả Fix 3: PASS: ${pass}, FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
}

executeTests();
