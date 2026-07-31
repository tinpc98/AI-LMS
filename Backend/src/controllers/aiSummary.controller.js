import aiSummaryService from "../ai/services/aiSummary.service.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";

/**
 * Controller xử lý luồng AI Summary
 */
class AISummaryController {
  // POST /api/ai/lectures/:lessonId/summary
  async generateSummary(req, res) {
    try {
      const lesson = req.aiLesson;
      const user = req.user;

      const summary = await aiSummaryService.generateSummary(lesson, user);

      return res.status(200).json({
        success: true,
        message: "Tạo bản tóm tắt AI thành công",
        data: {
          id: summary._id,
          lessonId: summary.lessonId,
          classId: summary.classId,
          version: summary.version,
          status: summary.status,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          suggestedReviewTopics: summary.suggestedReviewTopics,
          sourceWarnings: summary.sourceWarnings,
          createdAt: summary.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof AIError) {
        return res.status(error.status || 500).json({
          success: false,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }
      console.error("[AISummaryController.generateSummary] Lỗi hệ thống:", error);
      return res.status(500).json({
        success: false,
        code: AIErrorCode.AI_PROVIDER_ERROR,
        message: `Lỗi hệ thống khi tạo tóm tắt: ${error.message}`,
      });
    }
  }

  // GET /api/ai/lectures/:lessonId/summary
  async getSummary(req, res) {
    try {
      const { lessonId } = req.params;
      const role = (req.user.role || "").toLowerCase();

      let summary;
      if (role === "student") {
        summary = await aiSummaryService.getApprovedSummary(lessonId);
      } else {
        summary = await aiSummaryService.getLatestSummary(lessonId);
      }

      if (!summary) {
        return res.status(404).json({
          success: false,
          code: "NOT_FOUND",
          message: "Chưa có bản tóm tắt nào khả dụng cho bài giảng này.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Lấy bản tóm tắt thành công",
        data: summary,
      });
    } catch (error) {
      console.error("[AISummaryController.getSummary] Lỗi hệ thống:", error);
      return res.status(500).json({
        success: false,
        code: AIErrorCode.AI_PROVIDER_ERROR,
        message: `Lỗi hệ thống khi lấy tóm tắt: ${error.message}`,
      });
    }
  }

  // POST /api/ai/lectures/:lessonId/summary/:summaryId/approve
  async approveSummary(req, res) {
    try {
      const { lessonId, summaryId } = req.params;
      const userId = req.user.id || req.user._id;

      const summary = await aiSummaryService.approveSummary(lessonId, summaryId, userId);

      return res.status(200).json({
        success: true,
        message: "Duyệt bản tóm tắt thành công.",
        data: summary,
      });
    } catch (error) {
      if (error instanceof AIError) {
        return res.status(error.status || 500).json({
          success: false,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }
      console.error("[AISummaryController.approveSummary] Lỗi hệ thống:", error);
      return res.status(500).json({
        success: false,
        code: AIErrorCode.AI_PROVIDER_ERROR,
        message: `Lỗi hệ thống khi duyệt tóm tắt: ${error.message}`,
      });
    }
  }

  // POST /api/ai/lectures/:lessonId/summary/:summaryId/reject
  async rejectSummary(req, res) {
    try {
      const { lessonId, summaryId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id || req.user._id;

      const summary = await aiSummaryService.rejectSummary(lessonId, summaryId, userId, reason);

      return res.status(200).json({
        success: true,
        message: "Đã từ chối bản tóm tắt.",
        data: summary,
      });
    } catch (error) {
      if (error instanceof AIError) {
        return res.status(error.status || 500).json({
          success: false,
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }
      console.error("[AISummaryController.rejectSummary] Lỗi hệ thống:", error);
      return res.status(500).json({
        success: false,
        code: AIErrorCode.AI_PROVIDER_ERROR,
        message: `Lỗi hệ thống khi từ chối tóm tắt: ${error.message}`,
      });
    }
  }
}

export default new AISummaryController();
