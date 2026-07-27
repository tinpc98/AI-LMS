// File: src/controllers/examSet.controller.js
import { createExamSetService, getExamSetsService, updateExamSetService, deleteExamSetService, restoreExamSetService, addQuestionToExamSetService, updateQuestionInExamSetService, deleteQuestionFromExamSetService, reorderQuestionsInExamSetService } from "../services/examSet.services.js";

/**
 * Create new exam set
 * POST /api/exam-sets
 * Body: { folderId, title, description?, tags? }
 */
export const createExamSet = async (req, res) => {
  try {
    const { folderId, title, description, tags } = req.body;
    const ownerId = req.user.id; // From verifyUser middleware (JWT)

    // Validate input
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: "folderId là bắt buộc",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề là bắt buộc",
      });
    }

    // Prepare exam data
    const examData = {
      folderId,
      title,
      description,
      tags,
    };

    // Create exam set
    const examSet = await createExamSetService(ownerId, examData);

    return res.status(201).json({
      success: true,
      message: "Tạo bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Create error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi tạo bộ đề thi",
    });
  }
};

/**
 * Get exam sets with filters
 * GET /api/exam-sets
 * Query: folderId?, status?, page?, limit?
 */
export const getExamSets = async (req, res) => {
  try {
    const userId = req.user.id; // From verifyUser middleware (JWT)
    const { folderId, status, page = 1, limit = 10 } = req.query;

    // Prepare filters
    const filters = {
      folderId,
      status,
      page,
      limit,
    };

    // Get exam sets
    const result = await getExamSetsService(userId, filters);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bộ đề thi thành công",
      data: result.examSets,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[ExamSet] Get error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi lấy danh sách bộ đề thi",
    });
  }
};

/**
 * Update exam set (only owner, not published)
 * PATCH /api/exam-sets/:id
 * Body: { title?, description?, tags?, folderId? }
 */
export const updateExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From verifyUser middleware (JWT)
    const updateData = req.body;

    // Validate input
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp ít nhất một trường để cập nhật",
      });
    }

    // Update exam set
    const examSet = await updateExamSetService(id, userId, updateData);

    return res.status(200).json({
      success: true,
      message: "Cập nhật bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Update error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi cập nhật bộ đề thi",
    });
  }
};

/**
 * Delete exam set (soft delete)
 * DELETE /api/exam-sets/:id
 */
export const deleteExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From verifyUser middleware (JWT)

    // Delete exam set
    const examSet = await deleteExamSetService(id, userId);

    return res.status(200).json({
      success: true,
      message: "Xóa bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Delete error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi xóa bộ đề thi",
    });
  }
};

/**
 * Restore exam set (undo soft delete)
 * PATCH /api/exam-sets/:id/restore
 */
export const restoreExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From verifyUser middleware (JWT)

    // Restore exam set
    const examSet = await restoreExamSetService(id, userId);

    return res.status(200).json({
      success: true,
      message: "Khôi phục bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Restore error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi khôi phục bộ đề thi",
    });
  }
};

/**
 * Add question to exam set
 * POST /api/exam-sets/:id/questions
 * Body: {
 *   questionId, type, content, points?, difficulty?,
 *   options?, correctAnswer?, acceptedAnswers?, caseSensitive?,
 *   explanation?, feedbackCorrect?, feedbackIncorrect?,
 *   category?, tags?, isActive?, timeLimit?, imageUrl?, hint?, order?
 * }
 */
export const addQuestionToExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From verifyUser middleware (JWT)
    const questionData = req.body;

    const examSet = await addQuestionToExamSetService(id, userId, questionData);

    return res.status(201).json({
      success: true,
      message: "Thêm câu hỏi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Add question error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi thêm câu hỏi",
    });
  }
};

/**
 * Update question in exam set
 * PATCH /api/exam-sets/:id/questions/:questionId
 * Body: {
 *   type?, content?, points?, difficulty?,
 *   options?, correctAnswer?, acceptedAnswers?, caseSensitive?,
 *   explanation?, feedbackCorrect?, feedbackIncorrect?,
 *   category?, tags?, isActive?, timeLimit?, imageUrl?, hint?, order?
 * }
 */
export const updateQuestionInExamSet = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const userId = req.user.id; // From verifyUser middleware (JWT)
    const updateData = req.body;

    // Validate that update data is not empty
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu cập nhật là bắt buộc",
      });
    }

    // Update question in exam set
    const examSet = await updateQuestionInExamSetService(id, userId, questionId, updateData);

    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Update question error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi cập nhật câu hỏi",
    });
  }
};

/**
 * Delete question in exam set
 * DELETE /api/exam-sets/:id/questions/:questionId
 */
export const deleteQuestionInExamSet = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const examSet = await deleteQuestionFromExamSetService(id, userId, userRole, questionId);

    return res.status(200).json({
      success: true,
      message: "Xóa câu hỏi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Delete question error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi xóa câu hỏi",
    });
  }
};

/**
 * Reorder questions within exam set
 * PATCH /api/exam-sets/:id/questions/reorder
 */
export const reorderQuestionsInExamSet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const reorderItems = req.body.questions;

    const examSet = await reorderQuestionsInExamSetService(id, userId, userRole, reorderItems);

    return res.status(200).json({
      success: true,
      message: "Sắp xếp lại câu hỏi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Reorder questions error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi sắp xếp lại câu hỏi",
    });
  }
};
