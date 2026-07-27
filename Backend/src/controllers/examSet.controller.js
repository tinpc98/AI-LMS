// File: src/controllers/examSet.controller.js
import { createExamSetService, getExamSetsService, updateExamSetService } from "../services/examSet.services.js";

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
