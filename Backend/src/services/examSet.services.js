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

/**
 * Get exam sets with filters
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} filters - Filter options
 * @param {string} filters.folderId - Filter by folder ID (optional)
 * @param {string} filters.status - Filter by status (optional)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10, max: 100)
 * @returns {Object} Paginated exam sets
 */
export const getExamSetsService = async (ownerId, filters = {}) => {
  // Build query - always filter by owner
  const query = {
    ownerId: ownerId,
    isDeleted: false,
  };

  // Filter by folder ID if provided
  if (filters.folderId) {
    query.folderId = filters.folderId;
  }

  // Filter by status if provided
  if (filters.status) {
    const validStatuses = ["draft", "published", "archived"];
    if (validStatuses.includes(filters.status.toLowerCase())) {
      query.status = filters.status.toLowerCase();
    }
  }

  // Pagination
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit) || 10));
  const skip = (page - 1) * limit;

  // Fetch exam sets
  const [examSets, total] = await Promise.all([
    ExamSet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("folderId", "name")
      .populate("ownerId", "fullName email"),
    ExamSet.countDocuments(query),
  ]);

  return {
    examSets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
