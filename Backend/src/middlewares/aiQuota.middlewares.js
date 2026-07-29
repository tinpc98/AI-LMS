import aiUsageService from "../ai/services/aiUsage.service.js";
import { AIError } from "../utils/aiError.js";

/**
 * Middleware factory for checking AI Quota and Feature Flags before request reaches controller
 * @param {string} feature - "summary" | "question-gen" | "exam-gen" | "grading" | "chatbot"
 */
export const checkAIQuota = (feature = "summary") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!",
        });
      }

      const userId = req.user.id || req.user._id;
      const userRole = req.user.role || "student";

      const quotaInfo = await aiUsageService.checkUserQuota(userId, userRole, feature);
      req.aiQuota = quotaInfo; // Inject quota metadata into request object

      next();
    } catch (error) {
      if (error instanceof AIError) {
        return res.status(error.status || 400).json({
          success: false,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }

      return res.status(500).json({
        success: false,
        message: `Lỗi hệ thống khi kiểm tra hạn mức AI: ${error.message}`,
      });
    }
  };
};
