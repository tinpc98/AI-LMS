import mongoose from "mongoose";
import AIKnowledgeChunk from "../../models/aiKnowledgeChunk.model.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

class AIVectorRetrieverService {
  /**
   * Retrieve chunks related to the query vector using Atlas Vector Search
   */
  async retrieveChunks({ queryVector, classId, lessonId }) {
    if (!queryVector || !Array.isArray(queryVector)) {
      throw new AIError("Query vector không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 400);
    }
    if (!classId || !lessonId) {
      throw new AIError("Yêu cầu classId và lessonId để giới hạn phạm vi tìm kiếm (Pre-filter).", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    const vectorIndexName = process.env.AI_VECTOR_INDEX_NAME || "ai_knowledge_vector_index";
    const topK = parseInt(process.env.RAG_TOP_K) || 5;
    const numCandidates = parseInt(process.env.RAG_NUM_CANDIDATES) || 100;
    const minScore = parseFloat(process.env.RAG_MIN_SCORE) || 0.65;

    // Phục vụ Unit Test khi không kết nối DB thật
    if (this._mockRetrieverResults) {
      return this._mockRetrieverResults;
    }

    try {
      const results = await AIKnowledgeChunk.aggregate([
        {
          $vectorSearch: {
            index: vectorIndexName,
            path: "embedding",
            queryVector,
            numCandidates,
            limit: topK * 2, // Lấy dư một chút để lọc lại bằng minScore
            filter: {
              $and: [
                { classId: new mongoose.Types.ObjectId(classId) },
                { lessonId: new mongoose.Types.ObjectId(lessonId) },
                { status: "ready" },
                { isDeleted: false }
              ]
            }
          }
        },
        {
          $project: {
            embedding: 0, // Không trả vector ra ngoài
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]);

      const filteredResults = results
        .filter(doc => doc.score >= minScore)
        .slice(0, topK);

      return filteredResults.map(doc => ({
        chunkId: doc.chunkId,
        sourceName: doc.sourceName,
        sourceType: doc.sourceType,
        lessonId: doc.lessonId.toString(),
        excerpt: doc.content,
        score: doc.score
      }));
    } catch (error) {
      const errMsg = error.message ? error.message.toLowerCase() : "";
      if (errMsg.includes("index") || errMsg.includes("search")) {
         throw new AIError(
           "Hệ thống Vector Search chưa được cấu hình (Index Not Found). Vui lòng cấu hình Atlas Vector Search theo tài liệu.",
           AIErrorCode.AI_CONFIG_ERROR,
           500
         );
      }
      throw new AIError("Lỗi truy vấn Vector Search: " + error.message, AIErrorCode.AI_PROVIDER_ERROR, 500);
    }
  }

  setMockResults(results) {
    this._mockRetrieverResults = results;
  }
}

export default new AIVectorRetrieverService();
