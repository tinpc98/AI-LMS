import aiChatService from "../ai/services/aiChat.service.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";
import mongoose from "mongoose";

export const createSession = async (req, res, next) => {
  try {
    let { lessonId, title } = req.body;
    const userId = req.user.id || req.user._id;
    const classId = req.aiClass?._id;

    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new AIError(
        "lessonId bắt buộc và phải là ObjectId hợp lệ.",
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    if (title !== undefined) {
      if (typeof title !== "string") {
        throw new AIError("title phải là chuỗi.", AIErrorCode.AI_INVALID_INPUT, 400);
      }
      title = title.trim();
      if (title.length > 200) {
        throw new AIError("title tối đa 200 ký tự.", AIErrorCode.AI_INVALID_INPUT, 400);
      }
    }

    if (!classId) {
      throw new AIError("Lớp học không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    const session = await aiChatService.createSession(userId, lessonId, classId, title);

    return res.status(201).json({
      success: true,
      message: "Tạo phiên trò chuyện thành công",
      data: session,
    });
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    let { message } = req.body;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new AIError(
        "sessionId bắt buộc và phải là ObjectId hợp lệ.",
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    if (message === undefined || typeof message !== "string" || message.trim() === "") {
      throw new AIError("Nội dung tin nhắn không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 400);
    }
    message = message.trim();

    const maxChars = parseInt(process.env.RAG_MAX_QUESTION_CHARS) || 2000;
    if (message.length > maxChars) {
      throw new AIError(
        `Nội dung tin nhắn quá dài (tối đa ${maxChars} ký tự).`,
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    const response = await aiChatService.sendMessage({
      sessionId,
      userId,
      userRole,
      message,
    });

    return res.status(200).json({
      success: true,
      data: response.message,
      usage: response.usage,
    });
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new AIError(
        "sessionId bắt buộc và phải là ObjectId hợp lệ.",
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }

    let pageNum = 1;
    let limitNum = 20;

    if (page !== undefined) {
      pageNum = Number(page);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        throw new AIError(
          "page phải là số nguyên dương lớn hơn hoặc bằng 1.",
          AIErrorCode.AI_INVALID_INPUT,
          400
        );
      }
    }

    if (limit !== undefined) {
      limitNum = Number(limit);
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new AIError(
          "limit phải là số nguyên từ 1 đến 100.",
          AIErrorCode.AI_INVALID_INPUT,
          400
        );
      }
    }

    const history = await aiChatService.getChatHistory(
      sessionId,
      userId,
      userRole,
      pageNum,
      limitNum
    );

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    next(error);
  }
};
