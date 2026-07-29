import mongoose from "mongoose";
import Lesson from "../../models/lesson.model.js";
import AIKnowledgeSource from "../../models/aiKnowledgeSource.model.js";
import AIKnowledgeChunk from "../../models/aiKnowledgeChunk.model.js";
import AISummary from "../../models/aiSummary.model.js";
import textChunker from "./textChunker.service.js";
import lessonContentExtractor from "./lessonContentExtractor.service.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";
import aiCoreService from "./aiCore.service.js";
import crypto from "crypto";

class AIKnowledgeIndexingService {
  /**
   * Tạo fingerprint cho nguồn dữ liệu
   */
  generateFingerprint(content, providerName, model, dimensions, configHash) {
    if (!content) return null;
    return crypto.createHash("sha256").update(content + "|" + providerName + "|" + model + "|" + dimensions + "|" + configHash).digest("hex");
  }

  /**
   * Embed một mảng các chunk an toàn (có batch limit)
   */
  async embedChunksSafely(chunksText, provider, dimensions, BATCH_SIZE = 3) {
    const results = [];
    for (let i = 0; i < chunksText.length; i += BATCH_SIZE) {
      const batch = chunksText.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(text => 
        provider.generateEmbedding({ 
          text, 
          taskType: "RETRIEVAL_DOCUMENT", 
          dimensions 
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.map(r => r.embedding));
    }
    return results;
  }

  /**
   * Index một source cụ thể
   */
  async indexSource(sourceData, { lessonId, classId, userId, provider, embeddingModel, dimensions, chunkConfig, force }) {
    const { sourceType, sourceId, sourceName, content } = sourceData;
    
    if (!content || content.trim().length === 0) {
      return { status: "skipped", reason: "Nội dung rỗng" };
    }

    const configHash = `max${chunkConfig.maxChars}_ov${chunkConfig.overlapChars}`;
    const providerName = provider.getName();
    const fingerprint = this.generateFingerprint(content, providerName, embeddingModel, dimensions, configHash);

    // Kiểm tra xem đã index chưa
    const existingSource = await AIKnowledgeSource.findOne({
      lessonId,
      sourceType,
      sourceId
    }).sort({ indexVersion: -1 });

    if (!force && existingSource && existingSource.sourceFingerprint === fingerprint && existingSource.status === "ready") {
      return { status: "ready", message: "Đã index trước đó", source: existingSource };
    }

    const nextVersion = existingSource ? existingSource.indexVersion + 1 : 1;

    // Tạo mới document ở trạng thái pending/indexing
    const newSource = await AIKnowledgeSource.create({
      classId,
      lessonId,
      sourceType,
      sourceId,
      sourceName,
      sourceFingerprint: fingerprint,
      embeddingModel,
      embeddingDimensions: dimensions,
      indexVersion: nextVersion,
      status: "indexing",
      indexedBy: userId
    });

    try {
      // 1. Chia chunks
      const chunksText = textChunker.chunkText(content, chunkConfig.maxChars, chunkConfig.overlapChars);
      
      if (chunksText.length === 0) {
        newSource.status = "failed";
        newSource.errorCode = AIErrorCode.AI_INVALID_INPUT;
        newSource.safeErrorMessage = "Không thể chia chunk tài liệu này";
        await newSource.save();
        return { status: "failed", reason: "Không thể chia chunk" };
      }

      // 2. Lấy Embeddings
      const embeddings = await this.embedChunksSafely(chunksText, provider, dimensions);

      // Validate dimensions & NaN
      if (embeddings.length !== chunksText.length) {
          throw new Error("Số lượng vector không khớp với số lượng chunk");
      }
      for (const vector of embeddings) {
          if (!vector || vector.length !== dimensions) {
              throw new Error(`Vector không đúng dimensions (Yêu cầu: ${dimensions})`);
          }
          for (const num of vector) {
             if (typeof num !== "number" || !Number.isFinite(num)) {
                 throw new Error("Vector chứa NaN hoặc Infinity");
             }
          }
      }

      // 3. Tạo documents chunk
      const chunkDocs = chunksText.map((text, i) => ({
        sourceId: newSource._id,
        classId,
        lessonId,
        chunkId: new mongoose.Types.ObjectId().toString(),
        chunkIndex: i,
        content: text,
        contentHash: textChunker.hashContent(text),
        embedding: embeddings[i],
        embeddingModel,
        embeddingDimensions: dimensions,
        indexVersion: nextVersion,
        sourceName,
        sourceType,
        status: "ready" // Sẽ được insert sau
      }));

      // 4. Lưu toàn bộ chunks
      try {
         await AIKnowledgeChunk.insertMany(chunkDocs);
      } catch (insertError) {
         // Cleanup chunks của source hiện tại nếu insert fail
         await AIKnowledgeChunk.deleteMany({ sourceId: newSource._id });
         throw insertError;
      }

      // 5. Cập nhật status thành ready
      newSource.status = "ready";
      newSource.chunkCount = chunkDocs.length;
      newSource.indexedAt = new Date();
      await newSource.save();

      // 6. Chuyển các version cũ của source này (cùng sourceId, sourceType, lessonId) thành superseded
      await AIKnowledgeSource.updateMany(
        { 
          lessonId, 
          sourceId, 
          sourceType,
          _id: { $ne: newSource._id },
          status: "ready"
        },
        { $set: { status: "superseded" } }
      );
      
      // Update chunks superseded
      const supersededSources = await AIKnowledgeSource.find({
          lessonId, 
          sourceId, 
          sourceType,
          status: "superseded"
      }).select("_id");
      
      const supersededSourceIds = supersededSources.map(s => s._id);
      if (supersededSourceIds.length > 0) {
          await AIKnowledgeChunk.updateMany(
             { sourceId: { $in: supersededSourceIds } },
             { $set: { status: "superseded" } }
          );
      }

      return { status: "ready", source: newSource };
    } catch (error) {
      newSource.status = "failed";
      newSource.errorCode = error.code || AIErrorCode.AI_PROVIDER_ERROR;
      newSource.safeErrorMessage = error.message;
      await newSource.save();
      // Xóa chunk mồ côi nếu có
      await AIKnowledgeChunk.deleteMany({ sourceId: newSource._id });
      throw error;
    }
  }

  /**
   * Main function to index entire lesson
   */
  async indexLessonKnowledge(lessonId, userId, force = false) {
    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson || lesson.isDeleted) {
      throw new AIError("Bài giảng không tồn tại hoặc đã bị xóa.", AIErrorCode.AI_INVALID_INPUT, 404);
    }
    const classId = lesson.classId;

    // Cấu hình chunk & model
    const maxChars = parseInt(process.env.RAG_CHUNK_MAX_CHARS) || 2400;
    const overlapChars = parseInt(process.env.RAG_CHUNK_OVERLAP_CHARS) || 300;
    const embeddingModel = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-2";
    const dimensions = parseInt(process.env.AI_EMBEDDING_DIMENSIONS) || 768;

    const provider = await aiCoreService.resolveProvider();
    const chunkConfig = { maxChars, overlapChars };

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let totalChunks = 0;
    const results = [];

    // 1. Index Text Bài giảng
    const lessonText = `Tiêu đề bài giảng: ${lesson.title || ""}\nMô tả: ${lesson.description || ""}`;
    try {
      const resText = await this.indexSource({
        sourceType: "lesson_text",
        sourceId: "lesson_" + lesson._id.toString(),
        sourceName: "Thông tin bài giảng",
        content: lessonText
      }, { lessonId, classId, userId, provider, embeddingModel, dimensions, chunkConfig, force });
      
      if (resText.status === "ready") {
          successCount++;
          totalChunks += (resText.source?.chunkCount || 0);
      } else if (resText.status === "skipped") {
          skippedCount++;
      } else {
          failedCount++;
      }
    } catch (err) {
      console.error("[Index Lesson] Failed to index text:", err.message);
      failedCount++;
    }

    // 2. Index Attachments
    if (lesson.attachments && Array.isArray(lesson.attachments)) {
      for (const attachment of lesson.attachments) {
        if (!attachment.url) continue;
        const lowerUrl = attachment.url.toLowerCase();
        let content = "";
        let sType = "";
        try {
          if (lowerUrl.endsWith(".pdf")) {
            const buffer = await lessonContentExtractor.fetchSafeBuffer(attachment.url);
            content = await lessonContentExtractor.extractPdf(buffer);
            sType = "attachment_pdf";
          } else if (lowerUrl.endsWith(".docx")) {
            const buffer = await lessonContentExtractor.fetchSafeBuffer(attachment.url);
            content = await lessonContentExtractor.extractDocx(buffer);
            sType = "attachment_docx";
          } else {
             skippedCount++;
             continue;
          }

          if (content) {
             const resAtt = await this.indexSource({
                sourceType: sType,
                sourceId: attachment.publicId || attachment._id?.toString() || attachment.url,
                sourceName: attachment.name,
                content
             }, { lessonId, classId, userId, provider, embeddingModel, dimensions, chunkConfig, force });
             
             if (resAtt.status === "ready") {
                 successCount++;
                 totalChunks += (resAtt.source?.chunkCount || 0);
             } else if (resAtt.status === "skipped") {
                 skippedCount++;
             } else {
                 failedCount++;
             }
          }
        } catch (err) {
           console.error(`[Index Lesson] Failed to index attachment ${attachment.name}:`, err.message);
           failedCount++;
        }
      }
    }

    // 3. Index Summary (Nếu có bản được duyệt)
    try {
        const approvedSummary = await AISummary.findOne({ lessonId, status: "approved" });
        if (approvedSummary) {
           let sumContent = "TÓM TẮT BÀI GIẢNG:\n";
           sumContent += approvedSummary.summary + "\n\nCÁC ĐIỂM CHÍNH:\n";
           sumContent += approvedSummary.keyPoints.join("\n");

           const resSum = await this.indexSource({
                sourceType: "approved_summary",
                sourceId: "summary_" + approvedSummary._id.toString(),
                sourceName: "Tóm tắt bài giảng",
                content: sumContent
             }, { lessonId, classId, userId, provider, embeddingModel, dimensions, chunkConfig, force });
             
             if (resSum.status === "ready") {
                 successCount++;
                 totalChunks += (resSum.source?.chunkCount || 0);
             } else if (resSum.status === "skipped") {
                 skippedCount++;
             } else {
                 failedCount++;
             }
        } else {
             skippedCount++; // Không có bản duyệt
        }
    } catch (err) {
        console.error("[Index Lesson] Failed to index summary:", err.message);
        failedCount++;
    }
    
    let overallStatus = "ready";
    if (successCount === 0 && failedCount > 0) overallStatus = "failed";
    else if (failedCount > 0) overallStatus = "partial";
    else if (successCount === 0) overallStatus = "skipped";

    return {
        lessonId,
        status: overallStatus,
        sourceCount: successCount + failedCount + skippedCount,
        chunkCount: totalChunks,
        successCount,
        failedCount,
        skippedCount,
        embeddingModel,
        embeddingDimensions: dimensions,
        indexedAt: new Date()
    };
  }
}

export default new AIKnowledgeIndexingService();
