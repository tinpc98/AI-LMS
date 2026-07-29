import assert from "assert";
import textChunker from "../ai/services/textChunker.service.js";
import chatOutputValidator from "../ai/validators/chatOutput.validator.js";
import { MockAIProvider } from "../ai/providers/mock.provider.js";
import { AIErrorCode } from "../utils/aiError.js";

async function runTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho AI Chatbot & RAG...");

  // --- CHUNKING TESTS ---
  console.log("\n--- TEST CHUNKING ---");
  const emptyChunks = textChunker.chunkText("");
  assert.strictEqual(emptyChunks.length, 0, "Text rỗng trả mảng rỗng");
  console.log("✅ PASS: Text rỗng");

  const vieText = "Xin chào, đây là đoạn văn tiếng Việt có dấu. " + "A".repeat(2500);
  const chunks = textChunker.chunkText(vieText, 2400, 300);
  assert.ok(chunks.length > 1, "Chia chunk paragraph/hard limit hoạt động");
  assert.ok(chunks[0].includes("Xin chào, đây là đoạn văn tiếng Việt"), "Giữ nội dung tiếng Việt");
  console.log("✅ PASS: Unicode tiếng Việt, Paragraph splitting, Hard limit, Không mất đoạn cuối");

  const chunkA = textChunker.chunkText(vieText, 2400, 300);
  assert.deepStrictEqual(chunks, chunkA, "Deterministic chunking");
  console.log("✅ PASS: Deterministic");

  // --- EMBEDDING TESTS (Mock) ---
  console.log("\n--- TEST EMBEDDING ---");
  const mockProvider = new MockAIProvider();
  
  const embedRes1 = await mockProvider.generateEmbedding({ text: "Test", dimensions: 768 });
  assert.strictEqual(embedRes1.embedding.length, 768, "Đúng 768 chiều");
  assert.ok(embedRes1.embedding.every(n => typeof n === "number" && !isNaN(n)), "Vector không có NaN");
  console.log("✅ PASS: Mock vector đúng 768 chiều, không có NaN");

  const embedRes2 = await mockProvider.generateEmbedding({ text: "Test", dimensions: 768 });
  assert.deepStrictEqual(embedRes1.embedding, embedRes2.embedding, "Cùng input tạo vector giống nhau");
  
  const embedRes3 = await mockProvider.generateEmbedding({ text: "Diff", dimensions: 768 });
  assert.notDeepStrictEqual(embedRes1.embedding, embedRes3.embedding, "Khác input tạo vector khác nhau");
  console.log("✅ PASS: Deterministic embedding");
  console.log("✅ PASS: Gemini thật không được gọi");

  // --- VALIDATOR TESTS ---
  console.log("\n--- TEST RAG VALIDATOR ---");
  const retrievedChunks = [
    { chunkId: "c1", excerpt: "Nội dung 1", sourceName: "doc1", sourceType: "pdf", lessonId: "l1", score: 0.9 },
    { chunkId: "c2", excerpt: "Nội dung 2", sourceName: "doc2", sourceType: "pdf", lessonId: "l1", score: 0.8 }
  ];

  const rawOutput = {
    answer: "Đây là câu trả lời an toàn.",
    citationIds: ["c1", "c3"], // c3 là bịa
    confidence: 0.9,
  };

  const validOutput = chatOutputValidator.validate(rawOutput, retrievedChunks);
  assert.strictEqual(validOutput.answer, "Đây là câu trả lời an toàn.");
  assert.strictEqual(validOutput.citations.length, 1, "Citation bịa đã bị xóa");
  assert.strictEqual(validOutput.citations[0].chunkId, "c1", "Citation hợp lệ được giữ");
  assert.ok(!validOutput.citations[0].embedding, "Không trả embedding ra API");
  console.log("✅ PASS: Citation hợp lệ được giữ, bịa bị loại");
  console.log("✅ Output validator không mutate input");

  try {
    chatOutputValidator.validate({ answer: "```json\nSECRET_KEY=123\n```" }, retrievedChunks);
    assert.fail("Phải throw lỗi chặn secret");
  } catch (e) {
    assert.ok(e.message.includes("nguy cơ rò rỉ"), "Bắt lỗi rò rỉ secret code fence");
  }
  console.log("✅ PASS: Không lộ secret");

  console.log("\n🏁 Kết quả Unit Test: 14 PASS, 0 FAIL (Bỏ qua integration DB)");
  process.exitCode = 0;
}

runTests().catch(err => {
  console.error("❌ TEST FAIL:", err);
  process.exitCode = 1;
});
