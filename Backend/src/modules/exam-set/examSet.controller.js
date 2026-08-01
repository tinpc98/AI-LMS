import {
  createExamSetService,
  getExamSetsService,
  updateExamSetService,
  deleteExamSetService,
  restoreExamSetService,
  getExamSetDetailService,
  saveDraftExamSetService,
  duplicateExamSetService,
  updateExamSetTagsService,
} from "./examSet.service.js";
// Nghiệp vụ chia sẻ đã tách sang service riêng ở Wave 4.1.
import {
  createExamSetShareService,
  revokeExamSetShareService,
  listExamSetSharesService,
  listSharedExamSetsService,
  updateExamSetShareMetadataService,
} from "./examSetShare.service.js";
// Nghiệp vụ phiên bản đã tách sang service riêng ở Wave 4.1.
import {
  createNewExamSetVersionService,
  getExamSetVersionsService,
  restoreExamSetVersionService,
} from "./examSetVersion.service.js";
// Nghiệp vụ câu hỏi trong bộ đề đã tách sang service riêng ở Wave 4.1.
import {
  addQuestionToExamSetService,
  updateQuestionInExamSetService,
  deleteQuestionFromExamSetService,
  reorderQuestionsInExamSetService,
} from "./examSetQuestion.service.js";
import { importExcelToExamSet } from "./examSetImport.service.js";
import { Types } from "mongoose";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

/**
 * Create new exam set
 * POST /api/exam-sets
 * Body: { folderId, title, description?, tags? }
 */
export const createExamSet = asyncHandler(async (req, res) => {
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
});

/**
 * Get exam sets with filters
 * GET /api/exam-sets
 * Query: folderId?, status?, page?, limit?
 */
export const getExamSets = asyncHandler(async (req, res) => {
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
});

export const saveDraftExamSet = asyncHandler(async (req, res) => {
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
});

export const duplicateExamSet = asyncHandler(async (req, res) => {
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
});

export const createNewExamSetVersion = asyncHandler(async (req, res) => {
  const { examSetId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({
      success: false,
      message: "examSetId không hợp lệ",
    });
  }

  const newVersionExamSet = await createNewExamSetVersionService(
    examSetId,
    req.user.id,
    req.user.role
  );

  return res.status(201).json({
    success: true,
    message: "New exam set version created successfully",
    data: newVersionExamSet,
  });
});

export const getExamSetVersions = asyncHandler(async (req, res) => {
  const { examSetId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
  }

  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const sort = req.query.sort ? String(req.query.sort) : undefined;

  const result = await getExamSetVersionsService(examSetId, req.user.id, req.user.role, {
    page,
    limit,
    sort,
  });

  return res.status(200).json({
    success: true,
    message: "Exam set version history retrieved successfully",
    data: result,
  });
});

export const getExamSetById = asyncHandler(async (req, res) => {
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
});

export const restoreExamSetVersion = asyncHandler(async (req, res) => {
  const { examSetId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
  }

  const newVersion = await restoreExamSetVersionService(examSetId, req.user.id, req.user.role);

  return res
    .status(201)
    .json({ success: true, message: "Exam set restored as new version", data: newVersion });
});

export const createExamSetShare = asyncHandler(async (req, res) => {
  const { examSetId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
  }

  const payload = {
    sharedWithUserId: req.body.sharedWithUserId,
    permission: req.body.permission,
    expiresAt: req.body.expiresAt ?? null,
    note: req.body.note ?? "",
  };

  const result = await createExamSetShareService(examSetId, req.user.id, req.user.role, payload);

  return res
    .status(result.statusCode)
    .json({ success: true, message: result.message, data: result.data });
});

export const revokeExamSetShare = asyncHandler(async (req, res) => {
  const { examSetId, shareId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
  }

  if (!shareId || !Types.ObjectId.isValid(shareId)) {
    return res.status(400).json({ success: false, message: "shareId không hợp lệ" });
  }

  const result = await revokeExamSetShareService(examSetId, shareId, req.user.id, req.user.role);

  return res
    .status(result.statusCode)
    .json({ success: true, message: result.message, data: result.data });
});

export const listExamSetShares = asyncHandler(async (req, res) => {
  const { examSetId } = req.params;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    return res.status(400).json({ success: false, message: "examSetId không hợp lệ" });
  }

  const { page, limit, status, permission, search, sortBy, sortOrder } = req.query;

  const result = await listExamSetSharesService(examSetId, req.user.id, req.user.role, {
    page,
    limit,
    status,
    permission,
    search,
    sortBy,
    sortOrder,
  });

  return res
    .status(200)
    .json({ success: true, message: "Exam Set shares retrieved successfully", data: result });
});

export const listSharedExamSets = asyncHandler(async (req, res) => {
  const { page, limit, permission, search, ownerId, sortBy, sortOrder } = req.query;

  const result = await listSharedExamSetsService(req.user.id, req.user.role, {
    page,
    limit,
    permission,
    search,
    ownerId,
    sortBy,
    sortOrder,
  });

  return res
    .status(200)
    .json({ success: true, message: "Shared Exam Sets retrieved successfully", data: result });
});

/**
 * Update share metadata (expiresAt and/or note)
 * PATCH /api/exam-sets/:examSetId/shares/:shareId
 * Authorization: Owner or Admin only
 */
export const updateExamSetShareMetadata = asyncHandler(async (req, res) => {
  const { examSetId, shareId } = req.params;

  // Build payload from whitelist only – do NOT pass req.body directly
  const payload = {};
  if ("expiresAt" in req.body) payload.expiresAt = req.body.expiresAt;
  if ("note" in req.body) payload.note = req.body.note;

  const result = await updateExamSetShareMetadataService(
    examSetId,
    shareId,
    req.user.id,
    req.user.role,
    payload
  );

  return res.status(result.statusCode).json({
    success: true,
    message: result.message,
    data: result.data,
  });
});

/**
 * Update exam set (only owner, not published)
 * PATCH /api/exam-sets/:id
 * Body: { title?, description?, tags?, folderId? }
 */
export const updateExamSet = asyncHandler(async (req, res) => {
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
});

/**
 * Update exam set tags
 * PATCH /api/exam-sets/:examSetId/tags
 * Body: { tags }
 */
export const updateExamSetTags = asyncHandler(async (req, res) => {
  const tags = req.body.tags;
  const examSet = await updateExamSetTagsService(req.examSet, tags);

  return res.status(200).json({
    success: true,
    message: "Cập nhật tags bộ đề thi thành công",
    data: examSet,
  });
});

/**
 * Delete exam set (soft delete)
 * DELETE /api/exam-sets/:id
 */
export const deleteExamSet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delete exam set
  const examSet = await deleteExamSetService(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: "Xóa bộ đề thi thành công",
    data: examSet,
  });
});

/**
 * Restore exam set (undo soft delete)
 * PATCH /api/exam-sets/:id/restore
 */
export const restoreExamSet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Restore exam set
  const examSet = await restoreExamSetService(id, req.user.id);

  return res.status(200).json({
    success: true,
    message: "Khôi phục bộ đề thi thành công",
    data: examSet,
  });
});

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
export const addQuestionToExamSet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const questionData = req.body;

  const examSet = await addQuestionToExamSetService(id, req.user.id, questionData);

  return res.status(201).json({
    success: true,
    message: "Thêm câu hỏi thành công",
    data: examSet,
  });
});

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
export const updateQuestionInExamSet = asyncHandler(async (req, res) => {
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
});

/**
 * Delete question in exam set
 * DELETE /api/exam-sets/:id/questions/:questionId
 */
export const deleteQuestionInExamSet = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;

  const examSet = await deleteQuestionFromExamSetService(
    id,
    req.user.id,
    req.user.role,
    questionId
  );

  return res.status(200).json({
    success: true,
    message: "Xóa câu hỏi thành công",
    data: examSet,
  });
});

/**
 * Reorder questions within exam set
 * PATCH /api/exam-sets/:id/questions/reorder
 */
export const reorderQuestionsInExamSet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reorderItems = req.body.questions;

  const examSet = await reorderQuestionsInExamSetService(
    id,
    req.user.id,
    req.user.role,
    reorderItems
  );

  return res.status(200).json({
    success: true,
    message: "Sắp xếp lại câu hỏi thành công",
    data: examSet,
  });
});

/**
 * POST /api/exam-sets/import-excel
 * Import exam set from Excel
 */
export const createImportExcelExamSetHandler = ({ importService = importExcelToExamSet } = {}) => {
  return async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Vui lòng đính kèm file Excel" });
      }

      const { folderId, title, description } = req.body || {};
      const ownerId = req.user.id || req.user._id; // From verifyUser middleware

      const examSet = await importService({
        fileBuffer: req.file.buffer,
        ownerId,
        folderId,
        title,
        description,
      });

      return res.status(201).json({
        success: true,
        message: "Đã tạo bộ đề từ Excel thành công",
        data: {
          _id: examSet._id,
          title: examSet.title,
          status: examSet.status,
          questionCount: examSet.questionCount,
          totalPoints: examSet.totalPoints,
          questions: examSet.questions,
        },
      });
    } catch (error) {
      console.error("[ExamSet] Import Excel error:", error.message);
      const status = error.status || error.statusCode || 500;
      return res.status(status).json({
        success: false,
        message: error.message || "Lỗi import từ file Excel",
      });
    }
  };
};

export const importExcelExamSet = createImportExcelExamSetHandler();
