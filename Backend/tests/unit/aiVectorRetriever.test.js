// Unit test cho aiVectorRetriever.service.js (PR-13 — RAG vector search evaluation).
// Trước PR-13, service này không có test nào dù là điểm truy vấn duy nhất của toàn bộ tính năng AI Chat/RAG.
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import aiVectorRetrieverService from "../../src/ai/services/aiVectorRetriever.service.js";
import AIKnowledgeChunk from "../../src/models/aiKnowledgeChunk.model.js";
import { AIErrorCode } from "../../src/utils/aiError.js";

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const LESSON_ID = new mongoose.Types.ObjectId().toString();

afterEach(() => {
  vi.restoreAllMocks();
  aiVectorRetrieverService.setMockResults(undefined);
  delete process.env.RAG_TOP_K;
  delete process.env.RAG_NUM_CANDIDATES;
  delete process.env.RAG_MIN_SCORE;
});

describe("aiVectorRetrieverService.retrieveChunks — validation", () => {
  it("throw AI_INVALID_INPUT nếu queryVector không phải mảng", async () => {
    await expect(
      aiVectorRetrieverService.retrieveChunks({ queryVector: "not-an-array", classId: CLASS_ID, lessonId: LESSON_ID })
    ).rejects.toMatchObject({ code: AIErrorCode.AI_INVALID_INPUT, status: 400 });
  });

  it("throw AI_INVALID_INPUT nếu thiếu classId hoặc lessonId", async () => {
    await expect(
      aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1, 0.2], classId: CLASS_ID })
    ).rejects.toMatchObject({ code: AIErrorCode.AI_INVALID_INPUT, status: 400 });

    await expect(
      aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1, 0.2], lessonId: LESSON_ID })
    ).rejects.toMatchObject({ code: AIErrorCode.AI_INVALID_INPUT, status: 400 });
  });
});

describe("aiVectorRetrieverService.retrieveChunks — mock hook (dùng trong test service khác)", () => {
  it("trả về _mockRetrieverResults trực tiếp mà không gọi DB khi đã setMockResults", async () => {
    const aggregateSpy = vi.spyOn(AIKnowledgeChunk, "aggregate");
    const fakeResults = [{ chunkId: "c1", excerpt: "nội dung giả" }];
    aiVectorRetrieverService.setMockResults(fakeResults);

    const result = await aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID });

    expect(result).toBe(fakeResults);
    expect(aggregateSpy).not.toHaveBeenCalled();
  });
});

describe("aiVectorRetrieverService.retrieveChunks — lọc theo minScore và topK", () => {
  it("lọc bỏ kết quả có score < minScore (mặc định 0.65) và giới hạn topK (mặc định 5)", async () => {
    const rawDocs = Array.from({ length: 8 }, (_, i) => ({
      chunkId: `c${i}`,
      sourceName: "Nguồn " + i,
      sourceType: "lesson_text",
      lessonId: new mongoose.Types.ObjectId(LESSON_ID),
      content: "Nội dung " + i,
      score: 0.9 - i * 0.05, // 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55
    }));
    vi.spyOn(AIKnowledgeChunk, "aggregate").mockResolvedValue(rawDocs);

    const result = await aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID });

    // Chỉ 6 docs đầu có score >= 0.65, nhưng topK mặc định = 5 nên chỉ lấy 5
    expect(result).toHaveLength(5);
    expect(result.every((r) => r.score >= 0.65)).toBe(true);
    expect(result[0]).toMatchObject({ chunkId: "c0", excerpt: "Nội dung 0", score: 0.9 });
  });

  it("tôn trọng RAG_TOP_K và RAG_MIN_SCORE tùy chỉnh qua biến môi trường", async () => {
    process.env.RAG_TOP_K = "2";
    process.env.RAG_MIN_SCORE = "0.8";
    const rawDocs = [
      { chunkId: "c1", sourceName: "A", sourceType: "lesson_text", lessonId: new mongoose.Types.ObjectId(LESSON_ID), content: "x", score: 0.95 },
      { chunkId: "c2", sourceName: "B", sourceType: "lesson_text", lessonId: new mongoose.Types.ObjectId(LESSON_ID), content: "y", score: 0.85 },
      { chunkId: "c3", sourceName: "C", sourceType: "lesson_text", lessonId: new mongoose.Types.ObjectId(LESSON_ID), content: "z", score: 0.7 },
    ];
    vi.spyOn(AIKnowledgeChunk, "aggregate").mockResolvedValue(rawDocs);

    const result = await aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID });

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.chunkId)).toEqual(["c1", "c2"]);
  });

  it("không có kết quả nào đạt minScore → trả về mảng rỗng, không throw", async () => {
    vi.spyOn(AIKnowledgeChunk, "aggregate").mockResolvedValue([
      { chunkId: "c1", sourceName: "A", sourceType: "lesson_text", lessonId: new mongoose.Types.ObjectId(LESSON_ID), content: "x", score: 0.1 },
    ]);

    const result = await aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID });
    expect(result).toEqual([]);
  });
});

describe("aiVectorRetrieverService.retrieveChunks — xử lý lỗi Atlas Search", () => {
  it("lỗi có chứa 'index'/'search' → AI_CONFIG_ERROR với thông báo dễ hiểu (chưa cấu hình Atlas Search Index)", async () => {
    vi.spyOn(AIKnowledgeChunk, "aggregate").mockRejectedValue(new Error("$vectorSearch index not found"));

    await expect(
      aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID })
    ).rejects.toMatchObject({ code: AIErrorCode.AI_CONFIG_ERROR, status: 500 });
  });

  it("lỗi khác (network, timeout...) → AI_PROVIDER_ERROR", async () => {
    vi.spyOn(AIKnowledgeChunk, "aggregate").mockRejectedValue(new Error("connection timed out"));

    await expect(
      aiVectorRetrieverService.retrieveChunks({ queryVector: [0.1], classId: CLASS_ID, lessonId: LESSON_ID })
    ).rejects.toMatchObject({ code: AIErrorCode.AI_PROVIDER_ERROR, status: 500 });
  });
});
