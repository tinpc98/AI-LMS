// File: src/controllers/examSet.controller.js
import { createExamSetService } from "../services/examSet.services.js";

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
