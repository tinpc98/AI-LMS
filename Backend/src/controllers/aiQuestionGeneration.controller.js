import aiQuestionGenerationService from "../ai/services/aiQuestionGeneration.service.js";
import Folder from "../models/folder.model.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";
import { validationResult } from "express-validator";
import { AIInputBudget } from "../ai/utils/aiInputBudget.js";

class AIQuestionGenerationController {
  // POST /api/ai/lectures/:lessonId/question-sets/generate
  async generateQuestionSet(req, res) {
    try {
      const lesson = req.aiLesson; // injected by aiLessonAccess middleware
      const user = req.user;

      const role = String(user.role || "").toLowerCase();
      if (role === "student") {
        throw new AIError(
          "Học sinh không có quyền sinh bộ đề",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }

      const questionCount = Number(req.body.questionCount);
      AIInputBudget.validateQuestionCount(questionCount);

      const questionTypes = req.body.questionTypes || {};
      const difficultyDistribution = req.body.difficultyDistribution || {};

      const sumTypes = Object.values(questionTypes).reduce((a, b) => a + Number(b), 0);
      if (sumTypes !== questionCount) {
        throw new AIError(
          `Tổng số lượng theo loại câu hỏi (${sumTypes}) phải bằng questionCount (${questionCount})`,
          AIErrorCode.AI_INVALID_INPUT,
          400
        );
      }

      const sumDifficulty = Object.values(difficultyDistribution).reduce(
        (a, b) => a + Number(b),
        0
      );
      if (sumDifficulty !== questionCount) {
        throw new AIError(
          `Tổng số lượng theo độ khó (${sumDifficulty}) phải bằng questionCount (${questionCount})`,
          AIErrorCode.AI_INVALID_INPUT,
          400
        );
      }

      const requestConfig = {
        folderId: req.body.folderId,
        title: String(req.body.title || "")
          .trim()
          .substring(0, 255),
        description: String(req.body.description || "")
          .trim()
          .substring(0, 2000),
        questionCount: questionCount,
        questionTypes: questionTypes,
        difficultyDistribution: difficultyDistribution,
        defaultPoints: 1,
        language: String(req.body.language || "vi").trim(),
        instructions: String(req.body.instructions || "")
          .trim()
          .substring(0, 2000),
      };

      const { examSet, sourceWarnings } = await aiQuestionGenerationService.generateQuestionSet(
        lesson,
        user.id || user._id,
        user.role,
        requestConfig
      );

      return res.status(201).json({
        success: true,
        message: "Tạo bộ câu hỏi AI thành công",
        data: {
          examSetId: examSet._id,
          lessonId: lesson._id,
          folderId: examSet.folderId,
          title: examSet.title,
          status: examSet.status,
          questionCount: examSet.questions.length, // S3-09 response format
          totalPoints: examSet.totalPoints || examSet.questions.length,
          sourceWarnings: sourceWarnings,
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
      console.error("[AIQuestionGenerationController.generateQuestionSet] Lỗi hệ thống:", error);
      return res.status(500).json({
        success: false,
        code: AIErrorCode.AI_PROVIDER_ERROR,
        message: `Lỗi hệ thống khi sinh câu hỏi: ${error.message}`,
      });
    }
  }
}

export default new AIQuestionGenerationController();
