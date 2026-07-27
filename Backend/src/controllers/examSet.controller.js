// File: src/controllers/examSet.controller.js
import { createExamSetService, getExamSetsService, updateExamSetService, deleteExamSetService, restoreExamSetService, addQuestionToExamSetService, updateQuestionInExamSetService, deleteQuestionFromExamSetService, reorderQuestionsInExamSetService, getExamSetDetailService, saveDraftExamSetService, duplicateExamSetService, updateExamSetTagsService, createNewExamSetVersionService, getExamSetVersionsService, restoreExamSetVersionService } from "../services/examSet.services.js";
import { Types } from "mongoose";

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

export const saveDraftExamSet = async (req, res) => {
  try {
    const examSetId = req.params.examSetId || req.params.id;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    const examSet = await saveDraftExamSetService(req.examSet, req.body);

    return res.status(200).json({
      success: true,
      message: "Lưu bản nháp thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Save draft error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi lưu bản nháp",
    });
  }
};

export const duplicateExamSet = async (req, res) => {
  try {
    const { examSetId } = req.params;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    const duplicatedExamSet = await duplicateExamSetService(examSetId, req.user.id, req.user.role);

    return res.status(201).json({
      success: true,
      message: "Exam set duplicated successfully",
      data: duplicatedExamSet,
    });
  } catch (error) {
    console.error("[ExamSet] Duplicate error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi duplicate bộ đề thi",
    });
  }
};

export const createNewExamSetVersion = async (req, res) => {
  try {
    const { examSetId } = req.params;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    const newVersionExamSet = await createNewExamSetVersionService(examSetId, req.user.id, req.user.role);

    return res.status(201).json({
      success: true,
      message: "New exam set version created successfully",
      data: newVersionExamSet,
    });
  } catch (error) {
    console.error("[ExamSet] Create version error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi tạo phiên bản mới của bộ đề thi",
    });
  }
};

export const getExamSetVersions = async (req, res) => {
  try {
    const { examSetId } = req.params;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : undefined;

    const result = await getExamSetVersionsService(examSetId, req.user.id, req.user.role, { page, limit, sort });

    return res.status(200).json({ success: true, message: "Exam set version history retrieved successfully", data: result });
  } catch (error) {
    console.error("[ExamSet] Get versions error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Lỗi lấy lịch sử phiên bản bộ đề thi" });
  }
};

export const getExamSetById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    const examSet = await getExamSetDetailService(id, user);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Get detail error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi lấy chi tiết bộ đề thi",
    });
  }
};

export const restoreExamSetVersion = async (req, res) => {
  try {
    const { examSetId } = req.params;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
    }

    const newVersion = await restoreExamSetVersionService(examSetId, req.user.id, req.user.role);

    return res.status(201).json({ success: true, message: "Exam set restored as new version", data: newVersion });
  } catch (error) {
    console.error("[ExamSet] Restore-version error:", error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Lỗi khôi phục phiên bản bộ đề thi" });
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
    const updateData = req.body;

    // Validate input
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp ít nhất một trường để cập nhật",
      });
    }

    // Update exam set
    const examSet = await updateExamSetService(id, req.user.id, updateData);

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
 * Update exam set tags
 * PATCH /api/exam-sets/:examSetId/tags
 * Body: { tags }
 */
export const updateExamSetTags = async (req, res) => {
  try {
    const tags = req.body.tags;
    const examSet = await updateExamSetTagsService(req.examSet, tags);

    return res.status(200).json({
      success: true,
      message: "Cập nhật tags bộ đề thi thành công",
      data: examSet,
    });
  } catch (error) {
    console.error("[ExamSet] Update tags error:", error.message);

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Lỗi cập nhật tags bộ đề thi",
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

    // Delete exam set
    const examSet = await deleteExamSetService(id, req.user.id);

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

    // Restore exam set
    const examSet = await restoreExamSetService(id, req.user.id);

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
    const questionData = req.body;

    const examSet = await addQuestionToExamSetService(id, req.user.id, questionData);

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
    const updateData = req.body;

    // Validate that update data is not empty
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu cập nhật là bắt buộc",
      });
    }

    // Update question in exam set
    const examSet = await updateQuestionInExamSetService(id, req.user.id, questionId, updateData);

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

    const examSet = await deleteQuestionFromExamSetService(id, req.user.id, req.user.role, questionId);

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
    const reorderItems = req.body.questions;

    const examSet = await reorderQuestionsInExamSetService(id, req.user.id, req.user.role, reorderItems);

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
