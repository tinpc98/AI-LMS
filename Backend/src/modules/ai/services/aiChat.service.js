import crypto from "crypto";
import AIChatSession from "../models/aiChatSession.model.js";
import AIChatMessage from "../models/aiChatMessage.model.js";
import { Lesson } from "#modules/lesson";
import { Class } from "#modules/class";
import { AIError, AIErrorCode } from "../aiError.js";
import aiCoreService from "./aiCore.service.js";
import chatOutputValidator from "../validators/chatOutput.validator.js";
import { AIInputBudget } from "../utils/aiInputBudget.js";

class AIChatService {
  /**
   * Tạo hash fingerprint cho nội dung (ngăn double-click)
   */
  generateContentFingerprint(sessionId, message) {
    return crypto
      .createHash("sha256")
      .update(sessionId + "|" + message)
      .digest("hex");
  }

  /**
   * Validate Access Session & Parent Entities
   */
  async _validateSessionAccess(sessionId, userId, userRole) {
    const session = await AIChatSession.findById(sessionId);
    if (!session || session.status === "deleted") {
      throw new AIError(
        "Phiên trò chuyện không tồn tại hoặc đã bị xóa.",
        AIErrorCode.AI_INVALID_INPUT,
        404
      );
    }
    if (session.userId.toString() !== userId.toString()) {
      throw new AIError(
        "Bạn không có quyền truy cập phiên trò chuyện này.",
        AIErrorCode.AI_FEATURE_DISABLED,
        403
      );
    }

    const lesson = await Lesson.findById(session.lessonId).lean();
    if (!lesson || lesson.isDeleted) {
      throw new AIError(
        "Bài giảng không tồn tại hoặc đã bị xóa.",
        AIErrorCode.AI_INVALID_INPUT,
        404
      );
    }

    const classDoc = await Class.findById(session.classId).lean();
    if (!classDoc || classDoc.isDeleted || classDoc._id.toString() !== lesson.classId.toString()) {
      throw new AIError(
        "Lớp học không tồn tại hoặc dữ liệu không nhất quán.",
        AIErrorCode.AI_INVALID_INPUT,
        404
      );
    }

    const role = (userRole || "").toLowerCase();

    if (role === "teacher") {
      if (String(classDoc.teacherId) !== String(userId)) {
        throw new AIError(
          "Bạn không phải là giáo viên phụ trách lớp học này.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }
    } else if (role === "student") {
      if (!lesson.isPublished) {
        throw new AIError(
          "Bài giảng này chưa được xuất bản.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }
      const isEnrolled =
        classDoc.students &&
        classDoc.students.some(
          (s) => String(s.studentId) === String(userId) && s.status === "Enrolled"
        );
      if (!isEnrolled) {
        throw new AIError(
          "Bạn không phải là học sinh hợp lệ của lớp học này.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }
    } else if (role !== "admin") {
      throw new AIError(
        "Vai trò không được phép truy cập Chat.",
        AIErrorCode.AI_FEATURE_DISABLED,
        403
      );
    }

    return { session, lesson, classDoc };
  }

  /**
   * Khởi tạo phiên chat mới
   */
  async createSession(userId, lessonId, classId, title) {
    let session = await AIChatSession.findOne({
      userId,
      lessonId,
      status: "active",
    });

    if (!session) {
      session = await AIChatSession.create({
        userId,
        lessonId,
        classId,
        title: title || "Hỏi đáp bài học",
      });
    }
    return session;
  }

  /**
   * Kiểm tra nhanh prompt injection
   */
  _isObviousPromptInjection(message) {
    const lower = message.toLowerCase();
    const blacklist = [
      "quên các hướng dẫn",
      "bỏ qua các hướng dẫn",
      "ignore previous instructions",
      "system prompt",
      "đáp án",
      "đề thi",
      "bài kiểm tra",
      "api key",
      "secret",
    ];
    for (const word of blacklist) {
      if (lower.includes(word)) return true;
    }
    return false;
  }

  /**
   * Gửi tin nhắn và nhận phản hồi từ AI
   */
  async sendMessage({ sessionId, userId, userRole, message }) {
    if (!message || message.trim() === "") {
      throw new AIError(
        "Nội dung tin nhắn không được để trống.",
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    const maxChars = parseInt(process.env.RAG_MAX_QUESTION_CHARS) || 2000;
    if (message.length > maxChars) {
      throw new AIError(
        `Nội dung tin nhắn quá dài (tối đa ${maxChars} ký tự).`,
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    // 1. Kiểm tra quyền và tính toàn vẹn (Full Validation)
    const { session, lesson, classDoc } = await this._validateSessionAccess(
      sessionId,
      userId,
      userRole
    );

    const contentFingerprint = this.generateContentFingerprint(sessionId, message);

    // Chống double submit trong 5 giây
    const recentMsg = await AIChatMessage.findOne({
      sessionId,
      userId,
      role: "user",
      requestFingerprint: contentFingerprint,
    }).sort({ createdAt: -1 });

    if (recentMsg && Date.now() - recentMsg.createdAt.getTime() < 5000) {
      throw new AIError(
        "Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ vài giây.",
        AIErrorCode.AI_PROVIDER_ERROR,
        429
      );
    }

    // 1.5. Chặn Prompt Injection mức độ thấp
    if (this._isObviousPromptInjection(message)) {
      const userMsg = await AIChatMessage.create({
        sessionId,
        userId,
        role: "user",
        content: message,
        requestFingerprint: contentFingerprint,
      });
      const safeFallbackMsg = await AIChatMessage.create({
        sessionId,
        userId,
        role: "assistant",
        content:
          "Tôi chỉ hỗ trợ giải đáp kiến thức bài học trong phạm vi tài liệu này. Tôi không thể cung cấp đáp án hoặc thực hiện các yêu cầu nằm ngoài phạm vi môn học.",
        citations: [],
        confidence: 0,
        requestFingerprint: userMsg._id.toString(),
      });
      await AIChatSession.findByIdAndUpdate(sessionId, { lastMessageAt: new Date() });
      return { message: safeFallbackMsg, retrievedChunks: [] };
    }

    // Lưu user message
    const userMessageDoc = await AIChatMessage.create({
      sessionId,
      userId,
      role: "user",
      content: message,
      requestFingerprint: contentFingerprint,
    });

    try {
      // 2. Embed câu hỏi
      const provider = await aiCoreService.resolveProvider();
      const embeddingModel = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-2";
      const dimensions = parseInt(process.env.AI_EMBEDDING_DIMENSIONS) || 768;

      const embedRes = await provider.generateEmbedding({
        text: message,
        taskType: "RETRIEVAL_QUERY",
        dimensions,
      });
      const queryVector = embedRes.embedding;

      // 3. Retrieve Vector
      const retrievedChunks = await aiVectorRetrieverService.retrieveChunks({
        queryVector,
        classId: session.classId.toString(),
        lessonId: session.lessonId.toString(),
      });

      // 4. Kiểm tra kết quả retrieve
      if (retrievedChunks.length === 0) {
        const safeFallbackMsg = await AIChatMessage.create({
          sessionId,
          userId,
          role: "assistant",
          content:
            "Tôi chưa tìm thấy thông tin này trong tài liệu bài học. Vui lòng hỏi các nội dung nằm trong phạm vi bài giảng.",
          citations: [],
          confidence: 0,
          requestFingerprint: userMessageDoc._id.toString(),
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

      // 5. Lấy lịch sử chat
      const maxHistory = parseInt(process.env.RAG_MAX_HISTORY_MESSAGES) || 10;
      const chatHistory = await AIChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(maxHistory + 1) // +1 vì đã có userMessageDoc
        .lean();

      chatHistory.reverse();
      const priorHistory = chatHistory.slice(0, -1);

      const promptParams = {
        classTitle: classDoc.className || "Lớp học",
        lessonTitle: lesson.title,
        contextChunks: validContextChunks,
        chatHistory: priorHistory,
        userQuestion: message,
      };

      // 6. Kiểm tra lại toàn bộ Budget trước khi gọi AI Core
      AIInputBudget.validateTextBudget(JSON.stringify(promptParams), "AI Chat/RAG");

      // 6.5. Gọi AI Core với Structured Output (ủy quyền hoàn toàn lifecycle Quota)
      const responseSchema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          citationIds: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          followUpQuestions: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
        },
        required: ["answer", "citationIds", "confidence"],
        additionalProperties: false,
      };

      const aiResponse = await aiCoreService.executeStructuredAI({
        userId,
        userRole,
        feature: "chatbot",
        templateName: "chat",
        promptParams: promptParams,
        referenceId: sessionId,
        referenceType: "AIChatSession",
        responseSchema,
        validatorFunc: (rawOutput) => chatOutputValidator.validate(rawOutput, validContextChunks),
      });

      // 7. Lưu Assistant Message
      const assistantMessageDoc = await AIChatMessage.create({
        sessionId,
        userId,
        role: "assistant",
        content: aiResponse.data.answer,
        citations: aiResponse.data.citations,
        confidence: aiResponse.data.confidence,
        warnings: aiResponse.data.warnings,
        aiUsageId: aiResponse.usageId,
        requestFingerprint: userMessageDoc._id.toString(),
      });

      await AIChatSession.findByIdAndUpdate(sessionId, { lastMessageAt: new Date() });

      return {
        message: {
          messageId: assistantMessageDoc._id,
          answer: assistantMessageDoc.content,
          citations: assistantMessageDoc.citations,
          confidence: assistantMessageDoc.confidence,
          followUpQuestions: aiResponse.data.followUpQuestions,
          warnings: assistantMessageDoc.warnings,
          createdAt: assistantMessageDoc.createdAt,
        },
        usage: {
          inputTokens: aiResponse.usage.inputTokens,
          outputTokens: aiResponse.usage.outputTokens,
          durationMs: aiResponse.usage.durationMs,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getChatHistory(sessionId, userId, userRole, page = 1, limit = 20) {
    await this._validateSessionAccess(sessionId, userId, userRole);

    const skip = (page - 1) * limit;
    const rawMessages = await AIChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const messages = rawMessages
      .map((msg) => ({
        messageId: msg._id,
        role: msg.role,
        content: msg.content,
        citations: msg.citations,
        confidence: msg.confidence,
        warnings: msg.warnings,
        createdAt: msg.createdAt,
      }))
      .reverse();
    const total = await AIChatMessage.countDocuments({ sessionId });

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new AIChatService();
