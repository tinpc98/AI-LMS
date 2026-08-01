import mongoose from "mongoose";
import { ExamAttempt } from "#modules/exam-attempt";
import aiGradingService from "../services/aiGrading.service.js";
import { AIError } from "../aiError.js";
import { verifyClassTeacherAccess } from "#modules/class";

/**
 * Endpoint yêu cầu AI chấm điểm đề xuất cho 1 câu tự luận
 * POST /api/ai/exam-attempts/:attemptId/questions/:questionId/grade-suggestion
 */
export const generateGradeSuggestion = async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const teacherId = req.user?.id || req.user?._id;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId) || !questionId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu hoặc sai attemptId/questionId" });
    }

    const attempt = await ExamAttempt.findById(attemptId).populate("examId");
    if (!attempt)
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên làm bài" });

    try {
      await verifyClassTeacherAccess(attempt.examId.classId, teacherId, req.user.role);
    } catch (authError) {
      return res
        .status(authError.status || 403)
        .json({ success: false, message: authError.message });
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
    const { attemptId, questionId } = req.params;
    const { suggestionId, action, finalScore, teacherFeedback } = req.body;
    const teacherId = req.user?.id || req.user?._id;

    if (!suggestionId || !action || !attemptId || !questionId) {
      return res.status(400).json({ success: false, message: "Thiếu các tham số bắt buộc" });
    }

    const attempt = await ExamAttempt.findById(attemptId).populate("examId");
    if (!attempt)
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên làm bài" });

    try {
      await verifyClassTeacherAccess(attempt.examId.classId, teacherId, req.user.role);
    } catch (authError) {
      return res
        .status(authError.status || 403)
        .json({ success: false, message: authError.message });
    }

    const validActions = ["accept", "adjust", "reject"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: "action không hợp lệ" });
    }

    const result = await aiGradingService.confirmGradeSuggestion({
      suggestionId,
      attemptId,
      questionId,
      action,
      finalScore,
      teacherFeedback,
      teacherId,
    });

    return res.status(200).json({
      success: true,
      message: action === "reject" ? "Đã từ chối gợi ý của AI" : "Đã xác nhận điểm thành công",
      data: result,
    });
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status || 400).json({
        success: false,
        code: error.code || "BAD_REQUEST",
        message: error.message,
        details: error.details || null,
      });
    }

    console.error("Lỗi confirmGradeSuggestion:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
