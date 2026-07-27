// File: src/services/examSet.services.js
import ExamSet from "../models/examSet.model.js";
import Folder from "../models/folder.model.js";

/**
 * Create new exam set
 * @param {string} ownerId - Owner user ID (from JWT)
 * @param {Object} examData - Exam set data
 * @param {string} examData.folderId - Folder ID (required)
 * @param {string} examData.title - Exam title (required)
 * @param {string} examData.description - Exam description (optional)
 * @param {Array} examData.tags - Tags (optional)
 * @returns {Object} Created exam set
 */
export const createExamSetService = async (ownerId, examData) => {
  // Validate required fields
  if (!examData.folderId) {
    const error = new Error("folderId là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!examData.title) {
    const error = new Error("Tiêu đề là bắt buộc");
    error.status = 400;
    throw error;
  }

  // Verify folder exists and belongs to the owner
  const folder = await Folder.findOne({
    _id: examData.folderId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!folder) {
    const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Create new exam set
  const newExamSet = new ExamSet({
    ownerId, // From JWT, not from client
    folderId: examData.folderId,
    title: examData.title.trim(),
    description: examData.description?.trim() || "",
    status: "draft", // Always default to draft
    tags: examData.tags || [],
    questions: [], // Empty by default
  });

  await newExamSet.save();
  return newExamSet;
};
