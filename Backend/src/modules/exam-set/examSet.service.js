// File: src/modules/exam-set/examSet.service.js
//
// CORE của bộ đề: CRUD bộ đề, lưu nháp, tag, nhân bản, xem chi tiết.
//
// Đây là phần SÓT LẠI sau khi chẻ god service 2.478 dòng ở Wave 4.1 — tức là phần thật
// sự thuộc về core, không phải phần chưa kịp phân loại. Các nhóm đã tách ra:
//
//   examSetShare.service.js     chia sẻ bộ đề          5 hàm   [4.1 bước 1]
//   examSetVersion.service.js   phiên bản              3 hàm   [4.1 bước 2]
//   examSetQuestion.service.js  câu hỏi trong bộ đề    5 hàm   [4.1 bước 3]
//   examSetStatus.js            quy tắc trạng thái     dùng chung core + question
//   examSetImport.service.js    nhập từ Excel          (đã tách sẵn từ trước)
//   examSet.metrics.js          tính lại tổng điểm     (đã tách sẵn từ trước)
//   examSetAccess.middleware.js phân quyền VIEW/EDIT   (đã tách sẵn từ trước)
import { Types } from "mongoose";
import ExamSet from "./examSet.model.js";
import { Folder } from "#modules/folder";
import { recalculateExamSetMetrics } from "./examSet.metrics.js";
import { isEditableExamSetStatus } from "./examSetStatus.js";

const normalizeExamSetTags = (tags) => {
  if (!Array.isArray(tags)) {
    const error = new Error("tags phải là một mảng");
    error.status = 400;
    throw error;
  }

  if (tags.length > 20) {
    const error = new Error("Không được phép có quá 20 tag");
    error.status = 400;
    throw error;
  }

  const normalizedTags = [];
  const seen = new Set();

  for (const [index, tag] of tags.entries()) {
    if (typeof tag !== "string") {
      const error = new Error(`tags[${index}] phải là chuỗi`);
      error.status = 400;
      throw error;
    }

    const trimmed = tag.trim().replace(/\s+/g, " ");
    if (trimmed === "") {
      const error = new Error(`tags[${index}] không được để trống`);
      error.status = 400;
      throw error;
    }

    const withoutHash = trimmed.replace(/^#+/, "");
    if (withoutHash === "") {
      const error = new Error(`tags[${index}] không được chỉ chứa ký tự #`);
      error.status = 400;
      throw error;
    }

    if (withoutHash.length > 30) {
      const error = new Error(`tags[${index}] không được quá 30 ký tự`);
      error.status = 400;
      throw error;
    }

    const normalized = withoutHash.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    normalizedTags.push(normalized);
  }

  return normalizedTags;
};

const initializeVersionMetadata = (examSet) => {
  if (!examSet) {
    return;
  }

  examSet.versionNumber = 1;
  examSet.version = 1;
  examSet.previousVersionId = null;
  examSet.isLatestVersion = true;

  if (!examSet.rootExamSetId) {
    examSet.rootExamSetId = examSet._id;
  }
};

const normalizeQuestionOrder = (questions) => {
  if (!Array.isArray(questions)) {
    return [];
  }
  return [...questions].sort((a, b) => {
    const aOrder = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
};

const buildExamSetDetailResponse = (examSet, access) => {
  const examObj = examSet.toObject ? examSet.toObject() : examSet;
  const owner = examObj.ownerId
    ? {
        id: String(examObj.ownerId._id || examObj.ownerId),
        name: examObj.ownerId.fullName || examObj.ownerId.name || "",
        avatar: examObj.ownerId.avatar || "",
      }
    : null;

  const folder = examObj.folderId
    ? {
        id: String(examObj.folderId._id || examObj.folderId),
        name: examObj.folderId.name || "",
      }
    : null;

  const questions = normalizeQuestionOrder(examObj.questions || []).map((question) => {
    const sanitizedQuestion = {
      questionId: question.questionId,
      order: question.order,
      type: question.type,
      content: question.content,
      imageUrl: question.imageUrl || null,
      hint: question.hint || "",
      points: question.points,
      difficulty: question.difficulty,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      acceptedAnswers: question.acceptedAnswers || [],
      caseSensitive: question.caseSensitive || false,
      explanation: question.explanation || "",
      feedbackCorrect: question.feedbackCorrect || "",
      feedbackIncorrect: question.feedbackIncorrect || "",
      suggestedAnswer: question.suggestedAnswer || "",
      rubric: question.rubric || [],
      category: question.category || "",
      tags: question.tags || [],
      isActive: question.isActive !== undefined ? question.isActive : true,
      timeLimit: question.timeLimit !== undefined ? question.timeLimit : null,
    };
    return sanitizedQuestion;
  });

  return {
    id: String(examObj._id),
    title: examObj.title,
    description: examObj.description || "",
    status: examObj.status,
    tags: examObj.tags || [],
    questionCount: examObj.questionCount || 0,
    totalPoints: examObj.totalPoints || 0,
    version: examObj.version || 1,
    questions,
    owner,
    folder,
    access,
    createdAt: examObj.createdAt,
    updatedAt: examObj.updatedAt,
  };
};

export const getExamSetDetailService = async (examSetId, user) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const query = {
    _id: examSetId,
    isDeleted: false,
  };

  if (String(user.role || "").toLowerCase() !== "admin") {
    query.ownerId = user.id;
  }

  const examSet = await ExamSet.findOne(query)
    .populate("ownerId", "fullName avatar")
    .populate("folderId", "name");

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền xem");
    error.status = 404;
    throw error;
  }

  const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === String(user.id);
  const access = {
    isOwner,
    permission: isOwner ? "OWNER" : "ADMIN",
    canView: true,
    canCopy: false,
    canEdit: isOwner,
    source: isOwner ? "OWNER" : "ADMIN",
  };

  return buildExamSetDetailResponse(examSet, access);
};

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
export const saveDraftExamSetService = async (examSet, draftData = {}) => {
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const allowedFields = ["title", "description", "tags", "folderId"];
  const updateFields = {};

  for (const field of allowedFields) {
    if (field in draftData && draftData[field] !== undefined) {
      updateFields[field] = draftData[field];
    }
  }

  if (updateFields.folderId) {
    const folder = await Folder.findOne({
      _id: updateFields.folderId,
      ownerId: examSet.ownerId,
      isDeleted: false,
    });

    if (!folder) {
      const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
      error.status = 404;
      throw error;
    }
  }

  if (updateFields.title) {
    updateFields.title = updateFields.title.trim();
  }

  if (updateFields.description) {
    updateFields.description = updateFields.description.trim();
  }

  if (Object.prototype.hasOwnProperty.call(updateFields, "tags")) {
    updateFields.tags = normalizeExamSetTags(updateFields.tags);
  }

  Object.assign(examSet, updateFields, { status: "draft" });

  recalculateExamSetMetrics(examSet);

  const savedExamSet = await examSet.save();
  if (savedExamSet && typeof savedExamSet.populate === "function") {
    return savedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
  }

  return savedExamSet;
};

export const updateExamSetTagsService = async (examSet, tags) => {
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  if (!isEditableExamSetStatus(examSet.status)) {
    const error = new Error("Không thể cập nhật tags khi bộ đề thi không ở trạng thái draft");
    error.status = 403;
    throw error;
  }

  const normalizedTags = normalizeExamSetTags(tags);
  examSet.tags = normalizedTags;

  const savedExamSet = await examSet.save();
  if (savedExamSet && typeof savedExamSet.populate === "function") {
    return savedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
  }

  return savedExamSet;
};

export const duplicateExamSetService = async (examSetId, currentUserId, currentUserRole) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const sourceExamSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  })
    .populate("ownerId", "fullName avatar")
    .populate("folderId", "name");

  if (!sourceExamSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc đã bị xóa");
    error.status = 404;
    throw error;
  }

  const sourceOwnerId = sourceExamSet.ownerId
    ? String(sourceExamSet.ownerId._id || sourceExamSet.ownerId)
    : "";
  const userRole = (currentUserRole || "").toLowerCase();
  const isOwner = sourceOwnerId === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền duplicate bộ đề thi này");
    error.status = 403;
    throw error;
  }

  const sourceObject = sourceExamSet.toObject ? sourceExamSet.toObject() : sourceExamSet;
  const sourceFolderId = sourceObject.folderId?._id || sourceObject.folderId || null;
  const clonedQuestions = Array.isArray(sourceObject.questions)
    ? sourceObject.questions.map((question) => ({
        ...question,
        _id: new Types.ObjectId(),
        questionId: question.questionId || `q-${new Types.ObjectId().toString()}`,
        order: question.order ?? 0,
        points: question.points ?? question.score ?? 1,
        isDeleted: undefined,
        deletedAt: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      }))
    : [];

  const baseTitle = sourceObject.title || "Exam Set";
  const duplicateTitle = /\s*-\s*Copy(?:\s*\d+)?$/i.test(baseTitle)
    ? baseTitle
    : `${baseTitle} - Copy`;

  const nextFolderId = isOwner ? sourceFolderId : null;
  if (nextFolderId) {
    const folder = await Folder.findOne({
      _id: nextFolderId,
      ownerId: currentUserId,
      isDeleted: false,
    });

    if (!folder) {
      if (isOwner) {
        const error = new Error("Folder hiện tại không thuộc quyền sở hữu của bạn");
        error.status = 400;
        throw error;
      }
    }
  }

  const duplicatedExamSet = new ExamSet({
    _id: new Types.ObjectId(),
    ownerId: currentUserId,
    folderId: isOwner && nextFolderId ? nextFolderId : null,
    title: duplicateTitle,
    description: sourceObject.description || "",
    tags: Array.isArray(sourceObject.tags) ? sourceObject.tags : [],
    status: "draft",
    questions: clonedQuestions,
    questionCount: 0,
    totalPoints: 0,
    version: 1,
    isDeleted: false,
  });

  initializeVersionMetadata(duplicatedExamSet);

  recalculateExamSetMetrics(duplicatedExamSet);

  await duplicatedExamSet.save();
  return duplicatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

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

  initializeVersionMetadata(newExamSet);

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

/**
 * Update exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated exam set
 */
export const updateExamSetService = async (examSetId, ownerId, updateData) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền sửa");
    error.status = 404;
    throw error;
  }

  // Cannot update published exam sets
  if (examSet.status === "published") {
    const error = new Error("Không thể sửa bộ đề thi đã xuất bản");
    error.status = 403;
    throw error;
  }

  // Allowed fields to update
  const allowedFields = ["title", "description", "tags", "folderId"];
  const updateFields = {};

  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  }

  // If updating folderId, verify new folder exists and belongs to owner
  if (updateFields.folderId) {
    const newFolder = await Folder.findOne({
      _id: updateFields.folderId,
      ownerId: ownerId,
      isDeleted: false,
    });

    if (!newFolder) {
      const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
      error.status = 404;
      throw error;
    }
  }

  // Normalize string fields
  if (updateFields.title) {
    updateFields.title = updateFields.title.trim();
  }

  if (updateFields.description) {
    updateFields.description = updateFields.description.trim();
  }

  if (Object.prototype.hasOwnProperty.call(updateFields, "tags")) {
    updateFields.tags = normalizeExamSetTags(updateFields.tags);
  }

  // Update exam set
  const updatedExamSet = await ExamSet.findByIdAndUpdate(examSetId, updateFields, {
    new: true,
    runValidators: true,
  })
    .populate("folderId", "name")
    .populate("ownerId", "fullName email");

  return updatedExamSet;
};

/**
 * Delete exam set (soft delete)
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @returns {Object} Deleted exam set
 */
export const deleteExamSetService = async (examSetId, ownerId) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền xóa");
    error.status = 404;
    throw error;
  }

  // Soft delete: mark isDeleted = true
  examSet.isDeleted = true;
  await examSet.save();

  return examSet;
};

/**
 * Restore exam set (undo soft delete)
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @returns {Object} Restored exam set
 */
export const restoreExamSetService = async (examSetId, ownerId) => {
  // Find deleted exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: true,
  }).withDeleted(); // Include soft deleted docs

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền khôi phục");
    error.status = 404;
    throw error;
  }

  // Restore: mark isDeleted = false
  examSet.isDeleted = false;
  await examSet.save();

  return examSet;
};
