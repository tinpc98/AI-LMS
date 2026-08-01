import aiKnowledgeIndexingService from "../services/aiKnowledgeIndexing.service.js";
import AIKnowledgeSource from "../models/aiKnowledgeSource.model.js";
import { AIError, AIErrorCode } from "../aiError.js";

export const indexLessonKnowledge = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { force } = req.body;
    const userId = req.user.id || req.user._id;

    // Trong ngữ cảnh này, route đã qua middleware isTeacher hoặc isAdmin,
    // và `aiLessonAccessMiddleware` sẽ đảm bảo lesson thuộc về lớp mà teacher dạy.
    // Lưu ý: RAG Backend architecture yêu cầu: không tự tiện index lớp khác.
    if (!req.aiLesson) {
      throw new AIError("Lỗi middleware bài giảng.", AIErrorCode.AI_PROVIDER_ERROR, 500);
    }

    const result = await aiKnowledgeIndexingService.indexLessonKnowledge(lessonId, userId, force);

    return res.status(200).json({
      success: true,
      message: "Đã lập chỉ mục dữ liệu bài học",
      data: result,
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

export const getIndexStatus = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    if (!req.aiLesson) {
      throw new AIError("Lỗi middleware bài giảng.", AIErrorCode.AI_PROVIDER_ERROR, 500);
    }

    // Lấy thông tin mới nhất từ DB
    const sources = await AIKnowledgeSource.find({ lessonId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: {
        lessonId,
        sourceCount: sources.length,
        sources,
      },
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
