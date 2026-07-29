import crypto from "crypto";
import AIChatSession from "../../models/aiChatSession.model.js";
import AIChatMessage from "../../models/aiChatMessage.model.js";
import Lesson from "../../models/lesson.model.js";
import Class from "../../models/class.model.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";
import aiCoreService from "./aiCore.service.js";
import aiUsageService from "./aiUsage.service.js";
import aiVectorRetrieverService from "./aiVectorRetriever.service.js";
import chatOutputValidator from "../validators/chatOutput.validator.js";

class AIChatService {
  /**
   * Tạo hash fingerprint cho câu hỏi để chống spam / double-submit
   */
  generateRequestFingerprint(sessionId, message) {
    return crypto.createHash("sha256").update(sessionId + "|" + message).digest("hex");
  }

  async getAiConfig() {
    const aiConfig = await aiUsageService.getOrCreateConfig();
    const defaultProvider = aiConfig.defaultProvider || "google-gemini";
    let providerService;
    
    if (defaultProvider === "mock") {
      const { MockAIProvider } = await import("../providers/mock.provider.js");
      providerService = new MockAIProvider();
    } else {
      const { GeminiAIProvider } = await import("../providers/gemini.provider.js");
      providerService = new GeminiAIProvider();
    }
    
    return providerService;
  }

  /**
   * Khởi tạo phiên chat mới
   */
  async createSession(userId, lessonId, classId, title) {
    const newSession = await AIChatSession.create({
      userId,
      lessonId,
      classId,
      title: title || "Hỏi đáp bài học",
    });
    return newSession;
  }

  /**
   * Gửi tin nhắn và nhận phản hồi từ AI
   */
  async sendMessage({ sessionId, userId, userRole, message }) {
    if (!message || message.trim() === "") {
      throw new AIError("Nội dung tin nhắn không được để trống.", AIErrorCode.AI_INVALID_INPUT, 400);
    }
    
    const maxChars = parseInt(process.env.RAG_MAX_QUESTION_CHARS) || 2000;
    if (message.length > maxChars) {
      throw new AIError(`Nội dung tin nhắn quá dài (tối đa ${maxChars} ký tự).`, AIErrorCode.AI_INVALID_INPUT, 400);
    }

    // 1. Kiểm tra session
    const session = await AIChatSession.findById(sessionId);
    if (!session || session.status === "deleted") {
      throw new AIError("Phiên trò chuyện không tồn tại hoặc đã bị xóa.", AIErrorCode.AI_INVALID_INPUT, 404);
    }
    if (session.userId.toString() !== userId.toString()) {
      throw new AIError("Bạn không có quyền truy cập phiên trò chuyện này.", AIErrorCode.AI_FEATURE_DISABLED, 403);
    }

    // Lấy thông tin bài học
    const lesson = await Lesson.findById(session.lessonId).lean();
    if (!lesson) {
      throw new AIError("Bài giảng không tồn tại.", AIErrorCode.AI_INVALID_INPUT, 404);
    }
    const classDoc = await Class.findById(session.classId).lean();
    if (!classDoc) {
      throw new AIError("Lớp học không tồn tại.", AIErrorCode.AI_INVALID_INPUT, 404);
    }

    const requestFingerprint = this.generateRequestFingerprint(sessionId, message);
    
    // Chống double submit (nếu message giống hệt gửi liên tục)
    const recentMsg = await AIChatMessage.findOne({
      sessionId,
      userId,
      role: "user",
      requestFingerprint
    }).sort({ createdAt: -1 });
    
    if (recentMsg && (Date.now() - recentMsg.createdAt.getTime() < 5000)) {
       throw new AIError("Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ vài giây.", AIErrorCode.AI_PROVIDER_ERROR, 429);
    }

    // Lưu user message
    const userMessageDoc = await AIChatMessage.create({
      sessionId,
      userId,
      role: "user",
      content: message,
      requestFingerprint
    });

    try {
      // 2. Reserve quota
      const aiUsageId = await aiUsageService.reserveQuota({
        userId,
        userRole,
        feature: "chatbot",
        referenceId: sessionId,
        referenceType: "AIChatSession",
      });

      // 3. Embed câu hỏi
      const provider = await this.getAiConfig();
      const embeddingModel = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-2";
      const dimensions = parseInt(process.env.AI_EMBEDDING_DIMENSIONS) || 768;

      const embedRes = await provider.generateEmbedding({
        text: message,
        taskType: "RETRIEVAL_QUERY", // Task type cho query (hoặc tuỳ model)
        dimensions
      });
      const queryVector = embedRes.embedding;

      // 4. Retrieve Vector
      const retrievedChunks = await aiVectorRetrieverService.retrieveChunks({
        queryVector,
        classId: session.classId.toString(),
        lessonId: session.lessonId.toString(),
      });

      // 5. Kiểm tra kết quả retrieve (nếu không có đủ thông tin)
      if (retrievedChunks.length === 0) {
        // Hoàn trả quota vì không đủ context để trả lời
        await aiUsageService.finalizeUsage(aiUsageId, {
          status: "failed",
          errorMessage: "Không tìm thấy nội dung phù hợp trong bài học để trả lời.",
        });

        const safeFallbackMsg = await AIChatMessage.create({
          sessionId,
          userId,
          role: "assistant",
          content: "Tôi chưa tìm thấy thông tin này trong tài liệu bài học. Vui lòng hỏi các nội dung nằm trong phạm vi bài giảng.",
          citations: [],
          confidence: 0,
          aiUsageId,
          requestFingerprint
        });
        
        await AIChatSession.findByIdAndUpdate(sessionId, { lastMessageAt: new Date() });
        return { message: safeFallbackMsg, retrievedChunks: [] };
      }

      // Giới hạn context theo maxChars
      const maxContextChars = parseInt(process.env.RAG_MAX_CONTEXT_CHARS) || 12000;
      let currentContextChars = 0;
      const validContextChunks = [];
      for (const chunk of retrievedChunks) {
         if (currentContextChars + chunk.excerpt.length <= maxContextChars) {
            validContextChunks.push(chunk);
            currentContextChars += chunk.excerpt.length;
         } else {
            break;
         }
      }

      // 6. Lấy lịch sử chat
      const maxHistory = parseInt(process.env.RAG_MAX_HISTORY_MESSAGES) || 10;
      const chatHistory = await AIChatMessage.find({ sessionId })
         .sort({ createdAt: -1 })
         .limit(maxHistory + 1) // +1 để bao gồm userMessageDoc vừa tạo
         .lean();
         
      // Lật ngược lại để đúng thứ tự thời gian
      chatHistory.reverse();
      // Bỏ tin nhắn cuối cùng (chính là userMessageDoc vừa tạo)
      const priorHistory = chatHistory.slice(0, -1);

      // 7. Gọi AI Core với Structured Output
      const responseSchema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          citationIds: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          followUpQuestions: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } }
        },
        required: ["answer", "citationIds", "confidence"],
        additionalProperties: false
      };

      const aiResponse = await aiCoreService.executeStructuredAI({
        feature: "chatbot",
        templateName: "chat",
        templateParams: {
          classTitle: classDoc.title || classDoc.name,
          lessonTitle: lesson.title,
          contextChunks: validContextChunks,
          chatHistory: priorHistory,
          userQuestion: message
        },
        responseSchema,
        aiUsageId
      });

      // 8. Validate Output (Xác thực citations)
      const validatedOutput = chatOutputValidator.validate(aiResponse.data, validContextChunks);

      // 9. Lưu Assistant Message
      const assistantMessageDoc = await AIChatMessage.create({
        sessionId,
        userId,
        role: "assistant",
        content: validatedOutput.answer,
        citations: validatedOutput.citations,
        confidence: validatedOutput.confidence,
        warnings: validatedOutput.warnings,
        aiUsageId,
        requestFingerprint // Gán cùng fingerprint để chống double insert cùng response
      });

      // Update session lastMessageAt
      await AIChatSession.findByIdAndUpdate(sessionId, { lastMessageAt: new Date() });

      return {
        message: {
          messageId: assistantMessageDoc._id,
          answer: assistantMessageDoc.content,
          citations: assistantMessageDoc.citations,
          confidence: assistantMessageDoc.confidence,
          followUpQuestions: validatedOutput.followUpQuestions,
          warnings: assistantMessageDoc.warnings,
          createdAt: assistantMessageDoc.createdAt
        },
        usage: {
          inputTokens: aiResponse.inputTokens,
          outputTokens: aiResponse.outputTokens,
          durationMs: aiResponse.durationMs
        }
      };

    } catch (error) {
       throw error;
    }
  }

  async getChatHistory(sessionId, userId, page = 1, limit = 20) {
    const session = await AIChatSession.findById(sessionId);
    if (!session || session.status === "deleted") {
      throw new AIError("Phiên trò chuyện không tồn tại.", AIErrorCode.AI_INVALID_INPUT, 404);
    }
    if (session.userId.toString() !== userId.toString()) {
      throw new AIError("Bạn không có quyền truy cập phiên trò chuyện này.", AIErrorCode.AI_FEATURE_DISABLED, 403);
    }

    const skip = (page - 1) * limit;
    const messages = await AIChatMessage.find({ sessionId })
       .sort({ createdAt: -1 })
       .skip(skip)
       .limit(limit)
       .lean();
    
    // Đảo ngược để list đúng chiều
    messages.reverse();

    const total = await AIChatMessage.countDocuments({ sessionId });
    
    return {
       messages,
       total,
       page,
       totalPages: Math.ceil(total / limit)
    };
  }
}

export default new AIChatService();
