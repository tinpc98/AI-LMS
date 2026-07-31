import { AIError, AIErrorCode } from "../aiError.js";

class ChatOutputValidator {
  /**
   * Validate and sanitize output from AI Chat
   * Do not mutate original input
   */
  validate(rawOutput, retrievedChunks = []) {
    if (!rawOutput || typeof rawOutput !== "object") {
      throw new AIError(
        "Output chatbot không hợp lệ (không phải JSON).",
        AIErrorCode.AI_OUTPUT_INVALID,
        500
      );
    }

    const validOutput = {
      answer: "",
      citations: [],
      confidence: 0,
      followUpQuestions: [],
      warnings: [],
    };

    if (typeof rawOutput.answer !== "string" || rawOutput.answer.trim() === "") {
      throw new AIError(
        "Chatbot không trả về câu trả lời hợp lệ.",
        AIErrorCode.AI_OUTPUT_INVALID,
        500
      );
    }

    // Check for obvious secret leakage anywhere in the answer
    if (
      /(API_KEY|API KEY|GEMINI_API_KEY|JWT_SECRET|PASSWORD|CLOUDINARY_API_SECRET|MONGO_URI|Bearer token|mongodb:\/\/|mongodb\+srv:\/\/)/i.test(
        rawOutput.answer
      )
    ) {
      throw new AIError(
        "Phát hiện nguy cơ rò rỉ dữ liệu nhạy cảm trong câu trả lời.",
        AIErrorCode.AI_OUTPUT_INVALID,
        500
      );
    }

    validOutput.answer = rawOutput.answer.trim();
    if (validOutput.answer.length > 5000) {
      validOutput.answer = validOutput.answer.substring(0, 5000) + "... (bị cắt ngắn vì quá dài)";
    }

    if (
      typeof rawOutput.confidence === "number" &&
      rawOutput.confidence >= 0 &&
      rawOutput.confidence <= 1
    ) {
      validOutput.confidence = rawOutput.confidence;
    } else {
      validOutput.confidence = 0.5; // default fallback
    }

    if (Array.isArray(rawOutput.followUpQuestions)) {
      validOutput.followUpQuestions = rawOutput.followUpQuestions
        .filter((q) => typeof q === "string" && q.trim().length > 0)
        .slice(0, 3) // Giới hạn tối đa 3 câu hỏi phụ
        .map((q) => q.trim().substring(0, 200));
    }

    if (Array.isArray(rawOutput.warnings)) {
      validOutput.warnings = rawOutput.warnings
        .filter((w) => typeof w === "string" && w.trim().length > 0)
        .slice(0, 3)
        .map((w) => w.trim().substring(0, 200));
    }

    // Process and validate citations securely
    // AI is only allowed to return an array of chunkIds, NOT the actual text
    // Backend reconstructs the actual citation from `retrievedChunks`
    if (Array.isArray(rawOutput.citationIds)) {
      const validChunkIds = new Set(retrievedChunks.map((c) => c.chunkId));
      const uniqueIds = [...new Set(rawOutput.citationIds.filter((id) => typeof id === "string"))];

      for (const cid of uniqueIds) {
        if (validChunkIds.has(cid)) {
          const chunk = retrievedChunks.find((c) => c.chunkId === cid);
          if (chunk) {
            validOutput.citations.push({
              chunkId: chunk.chunkId,
              sourceName: chunk.sourceName,
              sourceType: chunk.sourceType,
              lessonId: chunk.lessonId,
              // Excerpt is capped at 250 characters safely
              excerpt: chunk.excerpt.substring(0, 250) + (chunk.excerpt.length > 250 ? "..." : ""),
              score: chunk.score,
            });
          }
        }
      }
    }

    // Xử lý khi không có citation hợp lệ
    const isFallback = validOutput.answer.includes("Tôi chưa tìm thấy thông tin này");
    if (validOutput.citations.length === 0 && !isFallback) {
      validOutput.confidence = 0;
      validOutput.citations = [];
      validOutput.answer = "Tôi chưa tìm thấy thông tin này trong tài liệu bài học.";
    }

    return validOutput;
  }
}

export default new ChatOutputValidator();
