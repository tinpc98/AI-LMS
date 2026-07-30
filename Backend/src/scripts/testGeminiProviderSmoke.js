import 'dotenv/config';
import { GeminiAIProvider } from "../ai/providers/gemini.provider.js";

const runSmokeTest = async () => {
  if (process.env.RUN_REAL_AI_SMOKE !== "true") {
    throw new Error("Smoke test thật chỉ chạy khi RUN_REAL_AI_SMOKE=true");
  }

  if (process.env.AI_MOCK_MODE !== "false") {
    throw new Error("Smoke test thật yêu cầu AI_MOCK_MODE=false");
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("Thiếu GEMINI_API_KEY");
  }

  if (!process.env.AI_MODEL?.trim()) {
    throw new Error("Thiếu AI_MODEL");
  }

  console.log("==========================================");
  console.log("BẮT ĐẦU SMOKE TEST GEMINI PROVIDER THẬT");
  console.log("==========================================\n");

  const provider = new GeminiAIProvider(process.env.GEMINI_API_KEY, process.env.AI_MODEL);

  const responseSchema = {
    type: "object",
    properties: {
      success: {
        type: "boolean",
      },
      message: {
        type: "string",
      },
    },
    required: ["success", "message"],
    additionalProperties: false,
  };

  const prompt = `
Trả về một JSON object xác nhận Gemini API hoạt động.

Yêu cầu:
- success phải là true.
- message phải là "Gemini API hoạt động".
- Không dùng Markdown code fence.
- Không trả nội dung ngoài JSON.
`;

  const result = await provider.generateJSON({
    prompt,
    systemInstruction: "Bạn là hệ thống kiểm thử API. Chỉ trả về JSON hợp lệ.",
    responseSchema,
    temperature: 0,
    maxTokens: 512,
    timeoutMs: 30000,
  });

  console.log(`Provider: ${provider.getName()}`);
  console.log(`Model: ${provider.getModelName()}`);
  console.log(`Structured Output: PASS`);

  if (!result?.data) {
    throw new Error("Provider không trả về data");
  }

  if (result.data.success !== true) {
    throw new Error("Gemini không trả về success=true");
  }

  if (result.data.message !== "Gemini API hoạt động") {
    throw new Error("Gemini trả về message không đúng contract");
  }

  console.log(`JSON Validation: PASS`);
  console.log(`Input Tokens: ${result.inputTokens}`);
  console.log(`Output Tokens: ${result.outputTokens}`);
  console.log(`Finish Reason: ${result.finishReason}`);
};

async function main() {
  try {
    await runSmokeTest();
    console.log("\nGEMINI PROVIDER SMOKE TEST PASS");
    process.exitCode = 0;
  } catch (error) {
    console.error(`\n❌ SMOKE TEST THẤT BẠI: ${error.message}`);
    if (error.details) {
      console.error(error.details);
    }
    process.exitCode = 1;
  }
}

main();
