import aiGradingService from "../ai/services/aiGrading.service.js";
import { AIError } from "../utils/aiError.js";

/**
 * Endpoint yêu cầu AI chấm điểm đề xuất cho 1 câu tự luận
 * POST /api/ai/exam-attempts/:attemptId/questions/:questionId/grade-suggestion
 */
export const generateGradeSuggestion = async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const teacherId = req.user?.id || req.user?._id;

    if (!attemptId || !questionId) {
      return res.status(400).json({ success: false, message: "Thiếu attemptId hoặc questionId" });
    }

    const suggestion = await aiGradingService.generateGradeSuggestion({
      attemptId,
      questionId,
      teacherId,
    });

    return res.status(200).json({
      success: true,
      message: "Tạo gợi ý chấm điểm thành công",
      data: suggestion,
    });
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status || 400).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    console.error("Lỗi generateGradeSuggestion:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Endpoint xác nhận điểm (Giáo viên duyệt/từ chối/điều chỉnh gợi ý của AI)
 * POST /api/ai/exam-attempts/:attemptId/questions/:questionId/grade-confirmation
 */
export const confirmGradeSuggestion = async (req, res) => {
  try {
    const { suggestionId, action, finalScore, teacherFeedback } = req.body;
    const teacherId = req.user?.id || req.user?._id;

    if (!suggestionId || !action) {
      return res.status(400).json({ success: false, message: "Thiếu suggestionId hoặc action (accept/adjust/reject)" });
    }

    const validActions = ["accept", "adjust", "reject"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: "action không hợp lệ" });
    }

    const result = await aiGradingService.confirmGradeSuggestion({
      suggestionId,
      action,
      finalScore: action !== "reject" ? Number(finalScore) : null,
      teacherFeedback,
      teacherId,
    });

    return res.status(200).json({
      success: true,
      message: action === "reject" ? "Đã từ chối gợi ý của AI" : "Đã xác nhận điểm thành công",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi confirmGradeSuggestion:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
