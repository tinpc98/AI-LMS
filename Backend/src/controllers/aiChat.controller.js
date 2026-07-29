import aiChatService from "../ai/services/aiChat.service.js";
import { AIError } from "../utils/aiError.js";

export const createSession = async (req, res, next) => {
  try {
    const { lessonId, title } = req.body;
    const userId = req.user.id || req.user._id;
    const classId = req.aiClass?._id;

    if (!classId) {
      throw new AIError("Lớp học không hợp lệ.", "AI_INVALID_INPUT", 400);
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
    const { message } = req.body;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

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
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id || req.user._id;

    const history = await aiChatService.getChatHistory(sessionId, userId, parseInt(page), parseInt(limit));

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
