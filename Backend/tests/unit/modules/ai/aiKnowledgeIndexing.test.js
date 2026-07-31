// Unit test cho aiKnowledgeIndexing.service.js (PR-13 — RAG vector search evaluation).
// Trước PR-13, service này (fingerprint dedup, versioning, cleanup khi lỗi) hoàn toàn không có test.
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import aiKnowledgeIndexingService from "../../../../src/modules/ai/services/aiKnowledgeIndexing.service.js";
import AIKnowledgeSource from "../../../../src/modules/ai/models/aiKnowledgeSource.model.js";
import AIKnowledgeChunk from "../../../../src/modules/ai/models/aiKnowledgeChunk.model.js";

const LESSON_ID = new mongoose.Types.ObjectId().toString();
const CLASS_ID = new mongoose.Types.ObjectId().toString();
const USER_ID = new mongoose.Types.ObjectId().toString();

const DIMENSIONS = 4;
const CHUNK_CONFIG = { maxChars: 2400, overlapChars: 300 };

const makeFakeProvider = (embeddingFn) => ({
  getName: () => "fake-provider",
  generateEmbedding: embeddingFn || (async () => ({ embedding: [0.1, 0.2, 0.3, 0.4] })),
});

const baseArgs = (overrides = {}) => ({
  lessonId: LESSON_ID,
  classId: CLASS_ID,
  userId: USER_ID,
  provider: makeFakeProvider(),
  embeddingModel: "fake-model",
  dimensions: DIMENSIONS,
  chunkConfig: CHUNK_CONFIG,
  force: false,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateFingerprint", () => {
  it("là hàm thuần, cùng input luôn ra cùng hash", () => {
    const h1 = aiKnowledgeIndexingService.generateFingerprint(
      "nội dung",
      "gemini",
      "model-1",
      768,
      "cfg1"
    );
    const h2 = aiKnowledgeIndexingService.generateFingerprint(
      "nội dung",
      "gemini",
      "model-1",
      768,
      "cfg1"
    );
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("nội dung khác nhau → hash khác nhau", () => {
    const h1 = aiKnowledgeIndexingService.generateFingerprint(
      "nội dung A",
      "gemini",
      "model-1",
      768,
      "cfg1"
    );
    const h2 = aiKnowledgeIndexingService.generateFingerprint(
      "nội dung B",
      "gemini",
      "model-1",
      768,
      "cfg1"
    );
    expect(h1).not.toBe(h2);
  });

  it("trả về null nếu content rỗng/falsy", () => {
    expect(
      aiKnowledgeIndexingService.generateFingerprint("", "gemini", "model-1", 768, "cfg1")
    ).toBeNull();
  });
});

describe("embedChunksSafely", () => {
  it("gọi generateEmbedding cho từng chunk theo batch, giữ đúng thứ tự kết quả", async () => {
    const calls = [];
    const provider = makeFakeProvider(async ({ text }) => {
      calls.push(text);
      return { embedding: [text.length, 0, 0, 0] };
    });

    const texts = ["a", "bb", "ccc", "dddd", "e"];
    const results = await aiKnowledgeIndexingService.embedChunksSafely(
      texts,
      provider,
      DIMENSIONS,
      2
    );

    expect(calls).toEqual(texts);
    expect(results.map((r) => r[0])).toEqual([1, 2, 3, 4, 1]);
  });
});

describe("indexSource", () => {
  it("content rỗng → trả về skipped, không tạo Source nào", async () => {
    const createSpy = vi.spyOn(AIKnowledgeSource, "create");
    const result = await aiKnowledgeIndexingService.indexSource(
      { sourceType: "lesson_text", sourceId: "s1", sourceName: "Test", content: "   " },
      baseArgs()
    );
    expect(result).toEqual({ status: "skipped", reason: "Nội dung rỗng" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("fingerprint không đổi & force=false → không re-embed, trả về ready từ source cũ", async () => {
    const provider = makeFakeProvider();
    const embedSpy = vi.spyOn(provider, "generateEmbedding");

    const content = "Nội dung bài giảng ổn định";
    const fingerprint = aiKnowledgeIndexingService.generateFingerprint(
      content,
      "fake-provider",
      "fake-model",
      DIMENSIONS,
      "max2400_ov300"
    );
    const existingSource = {
      _id: "src-old",
      sourceFingerprint: fingerprint,
      status: "ready",
      indexVersion: 1,
    };

    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({
      sort: () => Promise.resolve(existingSource),
    });
    const createSpy = vi.spyOn(AIKnowledgeSource, "create");

    const result = await aiKnowledgeIndexingService.indexSource(
      { sourceType: "lesson_text", sourceId: "s1", sourceName: "Test", content },
      baseArgs({ provider })
    );

    expect(result).toEqual({
      status: "ready",
      message: "Đã index trước đó",
      source: existingSource,
    });
    expect(embedSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("force=true → vẫn re-index dù fingerprint không đổi", async () => {
    const content = "Nội dung bài giảng ổn định";
    const fingerprint = aiKnowledgeIndexingService.generateFingerprint(
      content,
      "fake-provider",
      "fake-model",
      DIMENSIONS,
      "max2400_ov300"
    );
    const existingSource = {
      _id: "src-old",
      sourceFingerprint: fingerprint,
      status: "ready",
      indexVersion: 1,
    };

    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({
      sort: () => Promise.resolve(existingSource),
    });

    const newSourceDoc = {
      _id: "src-new",
      status: "indexing",
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(AIKnowledgeSource, "create").mockResolvedValue(newSourceDoc);
    vi.spyOn(AIKnowledgeChunk, "insertMany").mockResolvedValue([]);
    vi.spyOn(AIKnowledgeSource, "updateMany").mockResolvedValue({});
    vi.spyOn(AIKnowledgeSource, "find").mockReturnValue({ select: () => Promise.resolve([]) });

    const result = await aiKnowledgeIndexingService.indexSource(
      { sourceType: "lesson_text", sourceId: "s1", sourceName: "Test", content },
      baseArgs({ force: true })
    );

    expect(result.status).toBe("ready");
    expect(AIKnowledgeSource.create).toHaveBeenCalled();
  });

  it("nội dung mới → tạo source version tiếp theo, insert chunks, chuyển version cũ thành superseded", async () => {
    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({
      sort: () =>
        Promise.resolve({
          _id: "src-old",
          indexVersion: 2,
          sourceFingerprint: "khac",
          status: "ready",
        }),
    });

    const newSourceDoc = {
      _id: "src-new",
      status: "indexing",
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(AIKnowledgeSource, "create").mockResolvedValue(newSourceDoc);
    const insertSpy = vi.spyOn(AIKnowledgeChunk, "insertMany").mockResolvedValue([]);
    const updateManySpy = vi.spyOn(AIKnowledgeSource, "updateMany").mockResolvedValue({});
    vi.spyOn(AIKnowledgeSource, "find").mockReturnValue({
      select: () => Promise.resolve([{ _id: "src-old" }]),
    });
    const chunkUpdateManySpy = vi.spyOn(AIKnowledgeChunk, "updateMany").mockResolvedValue({});

    const result = await aiKnowledgeIndexingService.indexSource(
      {
        sourceType: "lesson_text",
        sourceId: "s1",
        sourceName: "Test",
        content: "Nội dung hoàn toàn mới",
      },
      baseArgs()
    );

    expect(result.status).toBe("ready");
    expect(AIKnowledgeSource.create).toHaveBeenCalledWith(
      expect.objectContaining({ indexVersion: 3, status: "indexing" })
    );
    expect(insertSpy).toHaveBeenCalled();
    expect(updateManySpy).toHaveBeenCalled();
    expect(chunkUpdateManySpy).toHaveBeenCalledWith(
      { sourceId: { $in: ["src-old"] } },
      { $set: { status: "superseded" } }
    );
    expect(newSourceDoc.status).toBe("ready");
  });

  it("vector sai dimensions → đánh dấu source failed, xóa chunk mồ côi, ném lỗi", async () => {
    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({ sort: () => Promise.resolve(null) });
    const newSourceDoc = {
      _id: "src-new",
      status: "indexing",
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(AIKnowledgeSource, "create").mockResolvedValue(newSourceDoc);
    const deleteManySpy = vi.spyOn(AIKnowledgeChunk, "deleteMany").mockResolvedValue({});

    const badProvider = makeFakeProvider(async () => ({ embedding: [0.1, 0.2] })); // 2 chiều thay vì 4

    await expect(
      aiKnowledgeIndexingService.indexSource(
        {
          sourceType: "lesson_text",
          sourceId: "s1",
          sourceName: "Test",
          content: "Nội dung bất kỳ",
        },
        baseArgs({ provider: badProvider })
      )
    ).rejects.toThrow(/dimensions/i);

    expect(newSourceDoc.status).toBe("failed");
    expect(deleteManySpy).toHaveBeenCalledWith({ sourceId: "src-new" });
  });

  it("vector chứa NaN → đánh dấu source failed, ném lỗi", async () => {
    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({ sort: () => Promise.resolve(null) });
    const newSourceDoc = {
      _id: "src-new",
      status: "indexing",
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(AIKnowledgeSource, "create").mockResolvedValue(newSourceDoc);
    vi.spyOn(AIKnowledgeChunk, "deleteMany").mockResolvedValue({});

    const nanProvider = makeFakeProvider(async () => ({ embedding: [0.1, NaN, 0.3, 0.4] }));

    await expect(
      aiKnowledgeIndexingService.indexSource(
        {
          sourceType: "lesson_text",
          sourceId: "s1",
          sourceName: "Test",
          content: "Nội dung bất kỳ",
        },
        baseArgs({ provider: nanProvider })
      )
    ).rejects.toThrow(/NaN|Infinity/i);

    expect(newSourceDoc.status).toBe("failed");
  });

  it("insertMany thất bại → dọn dẹp chunk mồ côi rồi ném lại lỗi gốc", async () => {
    vi.spyOn(AIKnowledgeSource, "findOne").mockReturnValue({ sort: () => Promise.resolve(null) });
    const newSourceDoc = {
      _id: "src-new",
      status: "indexing",
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(AIKnowledgeSource, "create").mockResolvedValue(newSourceDoc);
    vi.spyOn(AIKnowledgeChunk, "insertMany").mockRejectedValue(new Error("Mongo insert lỗi"));
    const deleteManySpy = vi.spyOn(AIKnowledgeChunk, "deleteMany").mockResolvedValue({});

    await expect(
      aiKnowledgeIndexingService.indexSource(
        {
          sourceType: "lesson_text",
          sourceId: "s1",
          sourceName: "Test",
          content: "Nội dung bất kỳ",
        },
        baseArgs()
      )
    ).rejects.toThrow("Mongo insert lỗi");

    // deleteMany bị gọi 2 lần: 1 lần trong catch của insertMany, 1 lần trong catch tổng của indexSource
    expect(deleteManySpy).toHaveBeenCalledWith({ sourceId: "src-new" });
    expect(newSourceDoc.status).toBe("failed");
  });
});

describe("checkEmbeddingConfigConsistency", () => {
  const ORIGINAL_ENV = process.env.AI_EMBEDDING_DIMENSIONS;

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.AI_EMBEDDING_DIMENSIONS;
    else process.env.AI_EMBEDDING_DIMENSIONS = ORIGINAL_ENV;
  });

  it("chưa có chunk nào trong DB → coi là consistent (không có gì để so sánh)", async () => {
    vi.spyOn(AIKnowledgeChunk, "findOne").mockReturnValue({
      select: () => ({ lean: () => Promise.resolve(null) }),
    });

    const result = await aiKnowledgeIndexingService.checkEmbeddingConfigConsistency();
    expect(result).toEqual({ consistent: true, reason: "no_existing_chunks" });
  });

  it("dimensions env khớp với dữ liệu đã index → consistent, không cảnh báo", async () => {
    process.env.AI_EMBEDDING_DIMENSIONS = "768";
    vi.spyOn(AIKnowledgeChunk, "findOne").mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({ embeddingDimensions: 768, embeddingModel: "gemini-embedding-2" }),
      }),
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await aiKnowledgeIndexingService.checkEmbeddingConfigConsistency();
    expect(result).toEqual({ consistent: true, currentDimensions: 768 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("dimensions env LỆCH với dữ liệu đã index → không consistent, có cảnh báo console.warn", async () => {
    process.env.AI_EMBEDDING_DIMENSIONS = "1536";
    vi.spyOn(AIKnowledgeChunk, "findOne").mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({ embeddingDimensions: 768, embeddingModel: "gemini-embedding-2" }),
      }),
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await aiKnowledgeIndexingService.checkEmbeddingConfigConsistency();
    expect(result).toEqual({ consistent: false, currentDimensions: 1536, existingDimensions: 768 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/AI_EMBEDDING_DIMENSIONS/);
  });
});
