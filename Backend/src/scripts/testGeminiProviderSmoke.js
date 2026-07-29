import 'dotenv/config';
import { GeminiAIProvider } from "../ai/providers/gemini.provider.js";

const runSmokeTest = async () => {
  if (process.env.RUN_REAL_AI_SMOKE !== "true") {
    console.log("⏭️ Bỏ qua smoke test Gemini thật (Cần cờ RUN_REAL_AI_SMOKE=true)");
    process.exit(0);
  }

  if (process.env.AI_MOCK_MODE === "true") {
    console.error("❌ Cấu hình sai: AI_MOCK_MODE đang là true. Cần false để chạy thật.");
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Thiếu GEMINI_API_KEY.");
    process.exit(1);
  }

  if (!process.env.AI_MODEL) {
    console.error("❌ Thiếu AI_MODEL.");
    process.exit(1);
  }

  console.log("==========================================");
  console.log("🔥 BẮT ĐẦU SMOKE TEST GEMINI PROVIDER THẬT");
  console.log("==========================================\n");

  try {
    const provider = new GeminiAIProvider(process.env.GEMINI_API_KEY, process.env.AI_MODEL);
    
    if (provider.getName() !== "google-gemini") {
      throw new Error(`Tên provider không đúng: ${provider.getName()}`);
    }

    if (!provider.getModelName()) {
      throw new Error("Không có model name");
    }

    console.log(`[1] Khởi tạo Provider thành công: ${provider.getName()} | Model: ${provider.getModelName()}`);

    // Call generateJSON
    const prompt = "Please reply with a valid JSON object containing exactly one key 'message' with the value 'hello'.";
    
    const result = await provider.generateJSON({
      prompt,
      temperature: 0.1,
      maxTokens: 50,
      timeoutMs: 15000, // short timeout
      responseSchema: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      }
    });

    if (!result.data || result.data.message?.toLowerCase() !== "hello") {
      throw new Error("Dữ liệu trả về không khớp JSON yêu cầu.");
    }

    console.log(`[2] Generate JSON thành công. Duration: ${result.durationMs}ms`);
    console.log(`[3] Input Tokens: ${result.inputTokens} | Output Tokens: ${result.outputTokens}`);
    console.log("\n✅ SMOKE TEST PASSED.");
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ SMOKE TEST THẤT BẠI: ${error.message}`);
    process.exit(1);
  }
};

runSmokeTest();
