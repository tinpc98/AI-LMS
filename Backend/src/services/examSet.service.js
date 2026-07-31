// File: src/services/examSet.service.js
import { Types } from "mongoose";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare, { EXAM_SET_SHARE_STATUS } from "../models/examSetShare.model.js";
import { User } from "#modules/auth";
import { Folder } from "#modules/folder";
import { recalculateExamSetMetrics } from "./examSet.metrics.js";

const EDITABLE_EXAM_STATUSES = ["draft"];
const essayForbiddenFields = ["options", "correctAnswer", "acceptedAnswers", "caseSensitive"];
const VALID_QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "essay"];

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
 * Create or reactivate an ExamSetShare
 * @param {string} examSetId
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @param {Object} payload { sharedWithUserId, permission, expiresAt, note }
 */
export const createExamSetShareService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  payload = {}
) => {
  const { sharedWithUserId, permission, expiresAt = null, note = "" } = payload;

  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const examSet = await ExamSet.findOne({ _id: examSetId, isDeleted: false });
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền chia sẻ bộ đề thi này");
    error.status = 403;
    throw error;
  }

  if (!sharedWithUserId || !Types.ObjectId.isValid(sharedWithUserId)) {
    const error = new Error("sharedWithUserId không hợp lệ");
    error.status = 400;
    throw error;
  }

  // recipient must exist and be active
  const recipient = await User.findOne({ _id: sharedWithUserId });
  if (!recipient) {
    const error = new Error("Người nhận không tồn tại");
    error.status = 404;
    throw error;
  }

  const recipientRole = String(recipient.role || "").toLowerCase();
  if (recipientRole === "student") {
    const error = new Error("Không thể chia sẻ cho Student");
    error.status = 400;
    throw error;
  }

  if (String(sharedWithUserId) === String(currentUserId)) {
    const error = new Error("Không thể chia sẻ cho chính bạn");
    error.status = 400;
    throw error;
  }

  if (String(sharedWithUserId) === String(examSet.ownerId || examSet.ownerId?._id)) {
    const error = new Error("Không thể chia sẻ cho Owner của bộ đề");
    error.status = 400;
    throw error;
  }

  if (recipient.status && String(recipient.status).toLowerCase() !== "active") {
    const error = new Error("Không thể chia sẻ cho user đang bị vô hiệu hóa");
    error.status = 400;
    throw error;
  }

  if (expiresAt !== null) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      const error = new Error("expiresAt phải là thời điểm tương lai");
      error.status = 422;
      throw error;
    }
  }

  // Permission valid
  const allowed = ["VIEW", "EDIT"];
  if (!allowed.includes(permission)) {
    const error = new Error("permission không hợp lệ");
    error.status = 400;
    throw error;
  }

  // Check existing share record
  const existing = await ExamSetShare.findOne({ examSetId, sharedWithUserId });

  if (!existing) {
    const newShare = new ExamSetShare({
      examSetId,
      ownerId: examSet.ownerId,
      sharedWithUserId,
      permission,
      status: "ACTIVE",
      sharedBy: currentUserId,
      expiresAt: expiresAt || null,
      note: (note || "").trim(),
    });

    const saved = await newShare.save();
    return { statusCode: 201, message: "Exam Set shared successfully", data: saved };
  }

  // existing record found
  if (String(existing.status) === String(EXAM_SET_SHARE_STATUS.ACTIVE)) {
    const error = new Error("Share đang ACTIVE");
    error.status = 409;
    throw error;
  }

  // Reactivate revoked/expired
  existing.permission = permission;
  existing.expiresAt = expiresAt || null;
  existing.note = (note || "").trim();
  existing.status = EXAM_SET_SHARE_STATUS.ACTIVE;
  existing.sharedBy = currentUserId;
  existing.revokedAt = null;
  existing.revokedBy = null;

  const updated = await existing.save();
  return { statusCode: 200, message: "Share re-activated successfully", data: updated };
};

export const revokeExamSetShareService = async (
  examSetId,
  shareId,
  currentUserId,
  currentUserRole
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!shareId || !Types.ObjectId.isValid(shareId)) {
    const error = new Error("shareId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const examSet = await ExamSet.findOne({ _id: examSetId, isDeleted: false });
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const share = await ExamSetShare.findOne({ _id: shareId });
  if (!share) {
    const error = new Error("Share không tồn tại");
    error.status = 404;
    throw error;
  }

  if (String(share.examSetId) !== String(examSet._id)) {
    const error = new Error("Share không thuộc bộ đề thi này");
    error.status = 400;
    throw error;
  }

  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền thu hồi chia sẻ này");
    error.status = 403;
    throw error;
  }

  if (String(share.status) === String(EXAM_SET_SHARE_STATUS.REVOKED)) {
    const error = new Error("Share đã bị thu hồi");
    error.status = 409;
    throw error;
  }

  if (String(share.status) === String(EXAM_SET_SHARE_STATUS.EXPIRED)) {
    const error = new Error("Share đã hết hạn");
    error.status = 409;
    throw error;
  }

  if (String(share.sharedWithUserId) === String(examSet.ownerId || examSet.ownerId?._id)) {
    const error = new Error("Không thể thu hồi chia sẻ của Owner");
    error.status = 400;
    throw error;
  }

  share.status = EXAM_SET_SHARE_STATUS.REVOKED;
  share.revokedAt = new Date();
  share.revokedBy = currentUserId;

  const updated = await share.save();
  return { statusCode: 200, message: "Share revoked successfully", data: updated };
};

/**
 * Update share metadata: expiresAt and/or note
 *
 * Authorization: Owner or Admin only.
 * Shared user (VIEW/EDIT) cannot update metadata.
 *
 * Business rules:
 * - Share must be ACTIVE (REVOKED → 409).
 * - ACTIVE share with expiresAt in the past can still be updated (re-extend).
 * - No-op if no field actually changes → 409.
 * - Only expiresAt and note are updated; all other fields remain unchanged.
 *
 * @param {string} examSetId - From URL param
 * @param {string} shareId   - From URL param
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @param {Object} payload   - { expiresAt?, note? } – already validated by express-validator
 * @returns {{ statusCode, message, data }}
 */
export const updateExamSetShareMetadataService = async (
  examSetId,
  shareId,
  currentUserId,
  currentUserRole,
  payload = {}
) => {
  // ── Step 1: Validate IDs (defensive – validator handles this first) ────────
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!shareId || !Types.ObjectId.isValid(shareId)) {
    const error = new Error("shareId không hợp lệ");
    error.status = 400;
    throw error;
  }

  // ── Step 2: Find Exam Set (check soft delete) ─────────────────────────────
  const examSet = await ExamSet.findOne({ _id: examSetId, isDeleted: false });
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  // ── Step 3: Authorization – Owner or Admin only ───────────────────────────
  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền cập nhật metadata chia sẻ này");
    error.status = 403;
    throw error;
  }

  // ── Step 4: Find Share – must belong to this Exam Set ────────────────────
  const share = await ExamSetShare.findOne({
    _id: shareId,
    examSetId: examSet._id,
  });

  if (!share) {
    const error = new Error("Share không tồn tại hoặc không thuộc bộ đề thi này");
    error.status = 404;
    throw error;
  }

  // ── Step 5: Share must be ACTIVE (REVOKED cannot be updated) ─────────────
  if (String(share.status) === String(EXAM_SET_SHARE_STATUS.REVOKED)) {
    const error = new Error("Share đã bị thu hồi, không thể cập nhật metadata");
    error.status = 409;
    throw error;
  }

  // Note: ACTIVE share with expiresAt in the past is allowed to be updated
  // (Owner/Admin can re-extend). Middleware access check (not this service)
  // controls whether the shared user can still access.

  // ── Step 6: Build update object (whitelist only) ──────────────────────────
  const hasExpiresAt = "expiresAt" in payload;
  const hasNote = "note" in payload;

  // ── Step 7: Normalize values ──────────────────────────────────────────────
  let normalizedExpiresAt;
  if (hasExpiresAt) {
    if (payload.expiresAt === null) {
      normalizedExpiresAt = null;
    } else {
      normalizedExpiresAt = new Date(payload.expiresAt);
    }
  }

  let normalizedNote;
  if (hasNote) {
    if (payload.note === null) {
      normalizedNote = null;
    } else {
      // Trim + normalize to null if empty string
      const trimmed = String(payload.note).trim();
      normalizedNote = trimmed === "" ? null : trimmed;
    }
  }

  // ── Step 8: Detect no-op (compare only sent fields) ──────────────────────
  let isNoOp = true;

  if (hasExpiresAt) {
    const currentTs = share.expiresAt ? new Date(share.expiresAt).getTime() : null;
    const newTs = normalizedExpiresAt ? normalizedExpiresAt.getTime() : null;
    if (currentTs !== newTs) isNoOp = false;
  }

  if (hasNote) {
    // Compare normalized note (null vs null, or string vs string)
    const currentNote = share.note === undefined || share.note === "" ? null : share.note;
    const newNote = normalizedNote;
    if (currentNote !== newNote) isNoOp = false;
  }

  if (isNoOp) {
    const error = new Error("No share metadata changes detected");
    error.status = 409;
    throw error;
  }

  // ── Step 9: Apply changes via whitelist (never touch protected fields) ────
  if (hasExpiresAt) {
    share.expiresAt = normalizedExpiresAt;
  }

  if (hasNote) {
    share.note = normalizedNote === null ? "" : normalizedNote;
  }

  // ── Step 10: Save ─────────────────────────────────────────────────────────
  const updatedShare = await share.save({ validateModifiedOnly: true });

  return {
    statusCode: 200,
    message: "Share metadata updated successfully",
    data: updatedShare,
  };
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const listExamSetSharesService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  options = {}
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const examSet = await ExamSet.findOne({ _id: examSetId, isDeleted: false });
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền xem danh sách chia sẻ của bộ đề thi này");
    error.status = 403;
    throw error;
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    examSetId,
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.permission) {
    filter.permission = options.permission;
  }

  const sortBy = ["createdAt", "updatedAt", "expiresAt", "status", "permission"].includes(
    options.sortBy
  )
    ? options.sortBy
    : "createdAt";
  const sortOrder = String(options.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

  let sharedWithFilterIds = null;
  if (options.search) {
    const searchValue = String(options.search).trim();
    if (searchValue.length > 0) {
      const regex = new RegExp(escapeRegex(searchValue), "i");
      const users = await User.find({
        isDeleted: false,
        $or: [{ fullName: regex }, { email: regex }],
      }).select("_id");

      sharedWithFilterIds = users.map((user) => String(user._id));
      if (sharedWithFilterIds.length === 0) {
        return {
          items: [],
          pagination: {
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      filter.sharedWithUserId = { $in: sharedWithFilterIds };
    }
  }

  const [items, totalItems] = await Promise.all([
    ExamSetShare.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("sharedWithUserId", "fullName email role avatar status")
      .populate("sharedBy", "fullName email role")
      .populate("revokedBy", "fullName email role"),
    ExamSetShare.countDocuments(filter),
  ]);

  const mappedItems = items.map((share) => {
    const shareObject = share.toObject ? share.toObject() : share;
    const effectiveStatus =
      shareObject.status === EXAM_SET_SHARE_STATUS.ACTIVE &&
      shareObject.expiresAt &&
      new Date(shareObject.expiresAt).getTime() <= Date.now()
        ? EXAM_SET_SHARE_STATUS.EXPIRED
        : shareObject.status;

    return {
      _id: String(shareObject._id),
      examSetId: String(shareObject.examSetId),
      ownerId: String(shareObject.ownerId),
      sharedWithUser: shareObject.sharedWithUserId
        ? {
            _id: String(shareObject.sharedWithUserId._id || shareObject.sharedWithUserId),
            fullName: shareObject.sharedWithUserId.fullName || "",
            email: shareObject.sharedWithUserId.email || "",
            role: shareObject.sharedWithUserId.role || "",
            avatar: shareObject.sharedWithUserId.avatar || "",
            status: shareObject.sharedWithUserId.status || "",
          }
        : null,
      permission: shareObject.permission,
      status: shareObject.status,
      effectiveStatus,
      expiresAt: shareObject.expiresAt || null,
      note: shareObject.note || "",
      sharedBy: shareObject.sharedBy
        ? {
            _id: String(shareObject.sharedBy._id || shareObject.sharedBy),
            fullName: shareObject.sharedBy.fullName || "",
            email: shareObject.sharedBy.email || "",
          }
        : null,
      revokedAt: shareObject.revokedAt || null,
      revokedBy: shareObject.revokedBy
        ? {
            _id: String(shareObject.revokedBy._id || shareObject.revokedBy),
            fullName: shareObject.revokedBy.fullName || "",
            email: shareObject.revokedBy.email || "",
          }
        : null,
      createdAt: shareObject.createdAt,
      updatedAt: shareObject.updatedAt,
    };
  });

  return {
    items: mappedItems,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPreviousPage: page > 1,
    },
  };
};

export const listSharedExamSetsService = async (currentUserId, currentUserRole, options = {}) => {
  if (!currentUserId || !Types.ObjectId.isValid(currentUserId)) {
    const error = new Error("currentUserId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const userRole = String(currentUserRole || "").toLowerCase();
  if (!["teacher", "admin"].includes(userRole)) {
    const error = new Error("Bạn không có quyền truy cập API này");
    error.status = 403;
    throw error;
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
  const skip = (page - 1) * limit;
  const permission = options.permission;
  const ownerId = options.ownerId;
  const searchValue = String(options.search || "").trim();
  const sortByMap = {
    sharedAt: "createdAt",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    expiresAt: "expiresAt",
    permission: "permission",
  };
  const sortBy = sortByMap[options.sortBy] || "createdAt";
  const sortOrder = String(options.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  const now = new Date();

  const shareMatch = {
    sharedWithUserId: new Types.ObjectId(currentUserId),
    status: EXAM_SET_SHARE_STATUS.ACTIVE,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  if (permission) {
    shareMatch.permission = permission;
  }

  const examSetLookup = {
    from: ExamSet.collection.name,
    localField: "examSetId",
    foreignField: "_id",
    as: "examSet",
  };

  const ownerLookup = {
    from: User.collection.name,
    localField: "examSet.ownerId",
    foreignField: "_id",
    as: "owner",
  };

  const pipeline = [
    { $match: shareMatch },
    { $lookup: examSetLookup },
    { $unwind: "$examSet" },
    { $match: { "examSet.isDeleted": false } },
  ];

  if (ownerId) {
    pipeline.push({ $match: { "examSet.ownerId": new Types.ObjectId(ownerId) } });
  }

  if (searchValue.length > 0) {
    const regex = new RegExp(escapeRegex(searchValue), "i");
    pipeline.push({
      $match: {
        $or: [
          { "examSet.title": regex },
          { "examSet.description": regex },
          { "examSet.tags": regex },
        ],
      },
    });
  }

  pipeline.push({ $lookup: ownerLookup }, { $unwind: "$owner" });
  pipeline.push({ $sort: { [sortBy]: sortOrder } });

  pipeline.push({
    $facet: {
      items: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            share: {
              _id: "$_id",
              permission: "$permission",
              status: "$status",
              effectiveStatus: "ACTIVE",
              expiresAt: "$expiresAt",
              note: "$note",
              sharedAt: "$createdAt",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
            examSet: {
              _id: "$examSet._id",
              title: "$examSet.title",
              description: "$examSet.description",
              tags: "$examSet.tags",
              status: "$examSet.status",
              metrics: {
                totalQuestions: "$examSet.questionCount",
                totalPoints: "$examSet.totalPoints",
              },
              versionNumber: "$examSet.versionNumber",
              rootExamSetId: "$examSet.rootExamSetId",
              isLatestVersion: "$examSet.isLatestVersion",
              createdAt: "$examSet.createdAt",
              updatedAt: "$examSet.updatedAt",
            },
            owner: {
              _id: "$owner._id",
              fullName: "$owner.fullName",
              email: "$owner.email",
              avatar: "$owner.avatar",
            },
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await ExamSetShare.aggregate(pipeline);
  const items = (result[0]?.items || []).map((item) => item);
  const totalItems = result[0]?.totalCount?.[0]?.count || 0;

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Get version history for an exam set lineage
 * @param {string} examSetId - source exam set id
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @param {Object} options - { page, limit, sort }
 */
export const getExamSetVersionsService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  options = {}
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const source = await ExamSet.findOne({ _id: examSetId, isDeleted: false }).lean();
  if (!source) {
    const error = new Error("Bộ đề thi không tồn tại hoặc đã bị xóa");
    error.status = 404;
    throw error;
  }

  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = String(source.ownerId || source.ownerId?._id || "") === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    // Follow existing convention: return 404 to avoid revealing resource
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  const rootId = source.rootExamSetId ? String(source.rootExamSetId) : String(source._id);

  // Build base filter: include root doc and any doc that references rootExamSetId
  const filter = {
    $or: [{ _id: rootId }, { rootExamSetId: rootId }],
    isDeleted: false,
  };

  // If not admin, restrict to same owner as source to avoid leaking cross-owner lineage
  if (!isAdmin) {
    filter.ownerId = String(source.ownerId);
  }

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const sortDir = String(options.sort || "desc").toLowerCase() === "asc" ? 1 : -1;

  const projection = {
    questions: 0,
    settings: 0,
    shareRecords: 0,
    auditLogs: 0,
    aiUsageLogs: 0,
    reviewNotes: 0,
    __v: 0,
  };

  const query = ExamSet.find(filter).select(projection).lean();

  // Sorting by versionNumber only
  query.sort({ versionNumber: sortDir });

  const skip = (page - 1) * limit;
  query.skip(skip).limit(limit);

  const [items, total] = await Promise.all([query.exec(), ExamSet.countDocuments(filter)]);

  const versions = (items || []).map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    versionNumber: doc.versionNumber,
    versionLabel: doc.versionLabel || null,
    versionNote: doc.versionNote || null,
    status: doc.status,
    rootExamSetId: doc.rootExamSetId ? String(doc.rootExamSetId) : String(doc._id),
    previousVersionId: doc.previousVersionId ? String(doc.previousVersionId) : null,
    isLatestVersion: !!doc.isLatestVersion,
    ownerId: doc.ownerId ? String(doc.ownerId) : null,
    questionCount: doc.questionCount || 0,
    totalPoints: doc.totalPoints || 0,
    publishedAt: doc.publishedAt || null,
    approvedAt: doc.approvedAt || null,
    archivedAt: doc.archivedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return {
    rootExamSetId: rootId,
    currentExamSetId: String(source._id),
    versions,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const isEditableExamSetStatus = (status) => {
  return EDITABLE_EXAM_STATUSES.includes(String(status).toLowerCase());
};

export const ensureEssayQuestionFieldsAllowed = (type, payload, existingQuestion = null) => {
  const questionType = String(type || "")
    .trim()
    .toLowerCase();
  if (questionType !== "essay") {
    return;
  }

  for (const field of essayForbiddenFields) {
    if (payload[field] !== undefined) {
      const error = new Error(`ESSAY không sử dụng ${field}`);
      error.status = 400;
      throw error;
    }
  }

  const effectiveScore =
    payload.score !== undefined
      ? payload.score
      : payload.points !== undefined
        ? payload.points
        : existingQuestion?.points;

  if (effectiveScore === undefined) {
    const error = new Error("Score là bắt buộc cho ESSAY");
    error.status = 400;
    throw error;
  }
};

const normalizeBooleanAnswer = (correctAnswer) => {
  if (typeof correctAnswer === "boolean") {
    return correctAnswer;
  }
  if (typeof correctAnswer === "string") {
    return correctAnswer.toLowerCase().trim() === "true";
  }
  return undefined;
};

const buildTrueFalseOptions = (correctAnswer) => {
  const normalizedCorrect = normalizeBooleanAnswer(correctAnswer);
  return [
    { id: "true", text: "True", isCorrect: normalizedCorrect === true },
    { id: "false", text: "False", isCorrect: normalizedCorrect === false },
  ];
};

const validateTrueFalsePayload = (questionData) => {
  const correctAnswerValue = normalizeBooleanAnswer(questionData.correctAnswer);
  if (correctAnswerValue === undefined) {
    const error = new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
    error.status = 400;
    throw error;
  }

  if (!questionData.options) {
    questionData.options = buildTrueFalseOptions(correctAnswerValue);
    return;
  }

  if (!Array.isArray(questionData.options) || questionData.options.length !== 2) {
    const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
    error.status = 400;
    throw error;
  }

  const normalized = questionData.options.map((option) => {
    if (!option || typeof option !== "object") {
      const error = new Error("TRUE_FALSE options phải là object");
      error.status = 400;
      throw error;
    }
    return String(option.text || "")
      .trim()
      .toLowerCase();
  });

  if (!normalized.includes("true") || !normalized.includes("false")) {
    const error = new Error("TRUE_FALSE options phải gồm True và False");
    error.status = 400;
    throw error;
  }
};

const validateMultipleChoicePayload = (questionData) => {
  if (
    !questionData.options ||
    !Array.isArray(questionData.options) ||
    questionData.options.length < 2
  ) {
    const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
    error.status = 400;
    throw error;
  }

  const hasCorrectAnswer = questionData.options.some(
    (opt) =>
      opt.isCorrect === true ||
      opt.id === questionData.correctAnswer ||
      opt.text === questionData.correctAnswer
  );
  if (!hasCorrectAnswer) {
    const error = new Error("Phải có ít nhất 1 đáp án đúng");
    error.status = 400;
    throw error;
  }
};

const validateShortAnswerPayload = (questionData) => {
  if (!questionData.correctAnswer || String(questionData.correctAnswer).trim() === "") {
    const error = new Error("Câu hỏi trả lời ngắn phải có câu trả lời đúng");
    error.status = 400;
    throw error;
  }
};

const validateQuestionPayloadByType = (type, questionData) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  switch (normalizedType) {
    case "multiple_choice":
      return validateMultipleChoicePayload(questionData);
    case "true_false":
      return validateTrueFalsePayload(questionData);
    case "short_answer":
      return validateShortAnswerPayload(questionData);
    case "essay":
      return ensureEssayQuestionFieldsAllowed(normalizedType, questionData);
    default:
      return;
  }
};

const normalizeQuestionPayload = (type, questionData) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  if (normalizedType === "true_false") {
    if (questionData.options === undefined || questionData.options === null) {
      const correctAnswerValue = normalizeBooleanAnswer(questionData.correctAnswer);
      questionData.options = buildTrueFalseOptions(correctAnswerValue);
    }
  }
};

const resolveUpdateField = (field, updateData, existingQuestion) => {
  if (updateData[field] !== undefined) {
    return updateData[field];
  }
  return existingQuestion?.[field];
};

const validateQuestionUpdatePayloadByType = (type, updateData, existingQuestion) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  const effectiveOptions = resolveUpdateField("options", updateData, existingQuestion);
  const effectiveCorrectAnswer = resolveUpdateField("correctAnswer", updateData, existingQuestion);
  const effectivePoints = resolveUpdateField("points", updateData, existingQuestion);
  const effectiveScore = resolveUpdateField("score", updateData, existingQuestion);

  if (normalizedType === "multiple_choice") {
    if (updateData.options !== undefined) {
      if (!Array.isArray(effectiveOptions) || effectiveOptions.length < 2) {
        const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
        error.status = 400;
        throw error;
      }
    }

    if (updateData.correctAnswer !== undefined && Array.isArray(effectiveOptions)) {
      const matchById = effectiveOptions.some((option) => option.id === updateData.correctAnswer);
      const matchByText = effectiveOptions.some(
        (option) => option.text === updateData.correctAnswer
      );
      if (!matchById && !matchByText) {
        const error = new Error("correctAnswer phải tồn tại trong options");
        error.status = 400;
        throw error;
      }
    }
  }

  if (normalizedType === "true_false") {
    if (updateData.correctAnswer !== undefined) {
      const normalizedAnswer = normalizeBooleanAnswer(updateData.correctAnswer);
      if (normalizedAnswer === undefined) {
        const error = new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
        error.status = 400;
        throw error;
      }
    }

    if (updateData.options !== undefined) {
      if (!Array.isArray(effectiveOptions) || effectiveOptions.length !== 2) {
        const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
        error.status = 400;
        throw error;
      }
      const normalized = effectiveOptions.map((option) => {
        if (!option || typeof option !== "object") {
          const error = new Error("TRUE_FALSE options phải là object");
          error.status = 400;
          throw error;
        }
        return String(option.text || "")
          .trim()
          .toLowerCase();
      });
      if (!normalized.includes("true") || !normalized.includes("false")) {
        const error = new Error("TRUE_FALSE options phải gồm True và False");
        error.status = 400;
        throw error;
      }
    }
  }

  if (normalizedType === "short_answer") {
    if (updateData.correctAnswer !== undefined && String(updateData.correctAnswer).trim() === "") {
      const error = new Error("correctAnswer là bắt buộc cho short_answer");
      error.status = 400;
      throw error;
    }
  }

  if (normalizedType === "essay") {
    if (
      updateData.score !== undefined ||
      updateData.points !== undefined ||
      updateData.type !== undefined
    ) {
      ensureEssayQuestionFieldsAllowed(normalizedType, updateData, existingQuestion);
    }
  }
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

export const createNewExamSetVersionService = async (examSetId, currentUserId, currentUserRole) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const sourceExamSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  });

  if (!sourceExamSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc đã bị xóa");
    error.status = 404;
    throw error;
  }

  const sourceOwnerId = sourceExamSet.ownerId
    ? String(sourceExamSet.ownerId._id || sourceExamSet.ownerId)
    : "";
  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = sourceOwnerId === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền tạo phiên bản mới cho bộ đề thi này");
    error.status = 403;
    throw error;
  }

  if (!sourceExamSet.isLatestVersion) {
    const error = new Error("Chỉ có phiên bản mới nhất mới có thể tạo phiên bản mới");
    error.status = 409;
    throw error;
  }

  const sourceStatus = String(sourceExamSet.status || "").toLowerCase();
  if (sourceStatus === "draft") {
    const error = new Error("Draft can be edited directly; creating a new version is unnecessary");
    error.status = 409;
    throw error;
  }

  if (sourceStatus === "pending_review") {
    const error = new Error("Không thể tạo phiên bản mới khi bộ đề thi đang chờ duyệt");
    error.status = 409;
    throw error;
  }

  const rootExamSetId = sourceExamSet.rootExamSetId
    ? sourceExamSet.rootExamSetId
    : sourceExamSet._id;

  const maxVersionExamSet = await ExamSet.findOne({
    $or: [{ rootExamSetId: rootExamSetId }, { _id: rootExamSetId, rootExamSetId: null }],
  })
    .sort({ versionNumber: -1 })
    .select("versionNumber")
    .lean();

  const nextVersionNumber =
    maxVersionExamSet && typeof maxVersionExamSet.versionNumber === "number"
      ? maxVersionExamSet.versionNumber + 1
      : (sourceExamSet.versionNumber || 1) + 1;

  let sourceUpdated = false;
  if (!sourceExamSet.rootExamSetId) {
    sourceExamSet.rootExamSetId = sourceExamSet._id;
    sourceUpdated = true;
  }
  sourceExamSet.isLatestVersion = false;
  await sourceExamSet.save();
  sourceUpdated = true;

  let folderId = null;
  if (sourceExamSet.folderId) {
    const folder = await Folder.findOne({
      _id: sourceExamSet.folderId,
      ownerId: sourceOwnerId,
      isDeleted: false,
    });
    if (folder) {
      folderId = sourceExamSet.folderId;
    }
  }

  const sourceObject = sourceExamSet.toObject ? sourceExamSet.toObject() : sourceExamSet;
  const clonedQuestions = Array.isArray(sourceObject.questions)
    ? sourceObject.questions.map((question) => {
        const clonedQuestion = {
          ...question,
          _id: new Types.ObjectId(),
          options: Array.isArray(question.options)
            ? question.options.map((option) => ({ ...option }))
            : [],
          acceptedAnswers: Array.isArray(question.acceptedAnswers)
            ? [...question.acceptedAnswers]
            : [],
          rubric: Array.isArray(question.rubric)
            ? question.rubric.map((item) => ({ ...item }))
            : [],
        };

        delete clonedQuestion.isDeleted;
        delete clonedQuestion.deletedAt;
        delete clonedQuestion.createdAt;
        delete clonedQuestion.updatedAt;

        return clonedQuestion;
      })
    : [];

  const excludedKeys = new Set([
    "_id",
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "isDeleted",
    "status",
    "questionCount",
    "totalPoints",
    "version",
    "versionNumber",
    "rootExamSetId",
    "previousVersionId",
    "isLatestVersion",
    "ownerId",
    "reviewerId",
    "reviewNotes",
    "approvedBy",
    "approvedAt",
    "publishedAt",
    "archivedAt",
    "shareRecords",
    "importHistory",
    "auditLogs",
    "usageStatistics",
    "submissionData",
    "attemptData",
    "centerLibraryEntry",
    "aiUsageLogs",
  ]);

  const newExamSetData = {
    ownerId: sourceOwnerId,
    folderId,
    status: "draft",
    questions: clonedQuestions,
    questionCount: 0,
    totalPoints: 0,
    versionNumber: nextVersionNumber,
    version: nextVersionNumber,
    rootExamSetId,
    previousVersionId: sourceObject._id,
    isLatestVersion: true,
    isDeleted: false,
  };

  for (const [key, value] of Object.entries(sourceObject)) {
    if (excludedKeys.has(key) || key === "questions") {
      continue;
    }
    newExamSetData[key] = value;
  }

  const newExamSet = new ExamSet(newExamSetData);
  recalculateExamSetMetrics(newExamSet);

  try {
    await newExamSet.save();
  } catch (error) {
    const isDuplicateKey = error && (error.code === 11000 || error.codeName === "DuplicateKey");
    if (isDuplicateKey) {
      const duplicateError = new Error(
        "Đã có phiên bản mới được tạo với cùng versionNumber. Vui lòng thử lại."
      );
      duplicateError.status = 409;
      throw duplicateError;
    }

    if (sourceUpdated) {
      sourceExamSet.isLatestVersion = true;
      await sourceExamSet.save();
    }

    throw error;
  }

  return newExamSet;
};

/**
 * Restore a prior version by creating a new draft cloned from the given source version.
 * The new version's previousVersionId points to the latest version in the lineage (NOT the restored source).
 */
export const restoreExamSetVersionService = async (
  sourceExamSetId,
  currentUserId,
  currentUserRole
) => {
  if (!sourceExamSetId || !Types.ObjectId.isValid(sourceExamSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  const source = await ExamSet.findOne({ _id: sourceExamSetId, isDeleted: false });
  if (!source) {
    const error = new Error("Bộ đề thi không tồn tại hoặc đã bị xóa");
    error.status = 404;
    throw error;
  }

  const sourceOwnerId = source.ownerId ? String(source.ownerId._id || source.ownerId) : "";
  const userRole = String(currentUserRole || "").toLowerCase();
  const isOwner = sourceOwnerId === String(currentUserId);
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    const error = new Error("Bạn không có quyền khôi phục phiên bản này");
    error.status = 403;
    throw error;
  }

  // Determine root id (fallback to source id if missing)
  const rootId = source.rootExamSetId ? String(source.rootExamSetId) : String(source._id);

  // Find the latest version in the lineage
  const latest = await ExamSet.findOne({
    $or: [{ rootExamSetId: rootId }, { _id: rootId, rootExamSetId: null }],
    isDeleted: false,
  }).sort({ versionNumber: -1 });

  if (!latest) {
    const error = new Error("Không thể xác định phiên bản mới nhất của chuỗi");
    error.status = 500;
    throw error;
  }

  // Compute next version number
  const nextVersionNumber =
    (typeof latest.versionNumber === "number" ? latest.versionNumber : source.versionNumber || 1) +
    1;

  // Prepare folder preservation if exists and belongs to owner
  let folderId = null;
  if (source.folderId) {
    const folder = await Folder.findOne({
      _id: source.folderId,
      ownerId: sourceOwnerId,
      isDeleted: false,
    });
    if (folder) folderId = source.folderId;
  }

  const sourceObj = source.toObject ? source.toObject() : source;

  // Clone questions deeply with new ObjectIds
  const clonedQuestions = Array.isArray(sourceObj.questions)
    ? sourceObj.questions.map((q) => {
        const cloned = {
          ...q,
          _id: new Types.ObjectId(),
          options: Array.isArray(q.options) ? q.options.map((o) => ({ ...o })) : [],
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? [...q.acceptedAnswers] : [],
          rubric: Array.isArray(q.rubric) ? q.rubric.map((r) => ({ ...r })) : [],
        };

        delete cloned.isDeleted;
        delete cloned.deletedAt;
        delete cloned.createdAt;
        delete cloned.updatedAt;

        return cloned;
      })
    : [];

  const excludedKeys = new Set([
    "_id",
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "isDeleted",
    "status",
    "questionCount",
    "totalPoints",
    "version",
    "versionNumber",
    "rootExamSetId",
    "previousVersionId",
    "isLatestVersion",
    "ownerId",
    "reviewerId",
    "reviewNotes",
    "approvedBy",
    "approvedAt",
    "publishedAt",
    "archivedAt",
    "shareRecords",
    "importHistory",
    "auditLogs",
    "usageStatistics",
    "submissionData",
    "attemptData",
    "centerLibraryEntry",
    "aiUsageLogs",
  ]);

  const newExamSetData = {
    ownerId: sourceOwnerId,
    folderId,
    status: "draft",
    questions: clonedQuestions,
    questionCount: 0,
    totalPoints: 0,
    versionNumber: nextVersionNumber,
    version: nextVersionNumber,
    rootExamSetId: rootId,
    previousVersionId: latest._id,
    isLatestVersion: true,
    isDeleted: false,
  };

  for (const [key, value] of Object.entries(sourceObj)) {
    if (excludedKeys.has(key) || key === "questions") continue;
    newExamSetData[key] = value;
  }

  const newExamSet = new ExamSet(newExamSetData);
  recalculateExamSetMetrics(newExamSet);

  // Mark latest as not latest and save both within try/catch to rollback on error
  let latestUpdated = false;
  latest.isLatestVersion = false;
  await latest.save();
  latestUpdated = true;

  try {
    await newExamSet.save();
  } catch (err) {
    const isDuplicateKey = err && (err.code === 11000 || err.codeName === "DuplicateKey");
    if (isDuplicateKey) {
      const duplicateError = new Error(
        "Đã có phiên bản mới được tạo với cùng versionNumber. Vui lòng thử lại."
      );
      duplicateError.status = 409;
      throw duplicateError;
    }

    if (latestUpdated) {
      latest.isLatestVersion = true;
      await latest.save();
    }

    throw err;
  }

  return newExamSet;
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

/**
 * Add question to exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} questionData - Question data
 * @returns {Object} Updated exam set with new question
 */
export const addQuestionToExamSetService = async (examSetId, ownerId, questionData) => {
  // Validate required fields
  if (!questionData.questionId) {
    const error = new Error("questionId là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!questionData.type) {
    const error = new Error("Loại câu hỏi là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!questionData.content) {
    const error = new Error("Nội dung câu hỏi là bắt buộc");
    error.status = 400;
    throw error;
  }

  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Check if exam set is in editable status
  if (!isEditableExamSetStatus(examSet.status)) {
    const error = new Error("Không thể thêm câu hỏi khi bộ đề thi không ở trạng thái draft");
    error.status = 403;
    throw error;
  }

  // Normalize and validate question type
  if (typeof questionData.type === "string") {
    questionData.type = questionData.type.trim().toLowerCase();
  }

  if (!VALID_QUESTION_TYPES.includes(questionData.type)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  validateQuestionPayloadByType(questionData.type, questionData);
  normalizeQuestionPayload(questionData.type, questionData);

  // Check if question ID already exists
  const questionExists = examSet.questions.some((q) => q.questionId === questionData.questionId);
  if (questionExists) {
    const error = new Error("questionId đã tồn tại trong bộ đề thi này");
    error.status = 400;
    throw error;
  }

  // Prepare new question object
  const newQuestion = {
    questionId: questionData.questionId.trim(),
    order: questionData.order !== undefined ? questionData.order : examSet.questions.length,
    type: questionData.type,
    content: questionData.content.trim(),
    imageUrl: questionData.imageUrl || null,
    hint: questionData.hint ? questionData.hint.trim() : "",
    points:
      questionData.points !== undefined
        ? questionData.points
        : questionData.score !== undefined
          ? questionData.score
          : 1,
    difficulty: questionData.difficulty || "medium",
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : "",
    acceptedAnswers: questionData.acceptedAnswers || [],
    caseSensitive: questionData.caseSensitive || false,
    explanation: questionData.explanation ? questionData.explanation.trim() : "",
    feedbackCorrect: questionData.feedbackCorrect || "Chính xác!",
    feedbackIncorrect: questionData.feedbackIncorrect || "Sai rồi!",
    suggestedAnswer: questionData.suggestedAnswer ? questionData.suggestedAnswer.trim() : "",
    rubric: Array.isArray(questionData.rubric) ? questionData.rubric : [],
    category: questionData.category ? questionData.category.trim() : "",
    tags: questionData.tags || [],
    isActive: questionData.isActive !== undefined ? questionData.isActive : true,
    timeLimit: questionData.timeLimit || null,
  };

  // Add question to array
  examSet.questions.push(newQuestion);

  // Recalculate metrics explicitly in service before save
  recalculateExamSetMetrics(examSet);

  const updatedExamSet = await examSet.save();

  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Update question in exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {string} questionId - Question ID (not MongoDB _id)
 * @param {Object} updateData - Question data to update
 * @returns {Object} Updated exam set with modified question
 */
export const updateQuestionInExamSetService = async (
  examSetId,
  ownerId,
  questionId,
  updateData
) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Check if exam set is published (cannot update questions in published exams)
  if (examSet.status === "published") {
    const error = new Error("Không thể cập nhật câu hỏi trong bộ đề thi đã công bố");
    error.status = 403;
    throw error;
  }

  // Find question in the questions array
  const questionIndex = examSet.questions.findIndex((q) => q.questionId === questionId);
  if (questionIndex === -1) {
    const error = new Error("Câu hỏi không tồn tại");
    error.status = 404;
    throw error;
  }

  const question = examSet.questions[questionIndex];

  // Cannot update questionId (unique identifier)
  if (updateData.questionId && updateData.questionId !== questionId) {
    const error = new Error("Không thể thay đổi questionId");
    error.status = 400;
    throw error;
  }

  const effectiveType = updateData.type
    ? String(updateData.type).trim().toLowerCase()
    : question.type;
  if (!VALID_QUESTION_TYPES.includes(effectiveType)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  updateData.type = effectiveType;
  const mergedQuestion = {
    ...question.toObject(),
    ...updateData,
    type: effectiveType,
  };

  validateQuestionPayloadByType(effectiveType, mergedQuestion);
  validateQuestionUpdatePayloadByType(effectiveType, updateData, question);
  normalizeQuestionPayload(effectiveType, mergedQuestion);

  if (
    effectiveType === "true_false" &&
    updateData.correctAnswer !== undefined &&
    updateData.options === undefined
  ) {
    question.options = mergedQuestion.options;
  }

  if (updateData.score !== undefined) {
    question.points = updateData.score;
  }
  if (updateData.points !== undefined) {
    question.points = updateData.points;
  }

  // Allowed fields to update
  const allowedFields = [
    "type",
    "content",
    "imageUrl",
    "hint",
    "points",
    "difficulty",
    "options",
    "correctAnswer",
    "acceptedAnswers",
    "caseSensitive",
    "explanation",
    "feedbackCorrect",
    "feedbackIncorrect",
    "category",
    "tags",
    "isActive",
    "timeLimit",
    "order",
    "suggestedAnswer",
    "rubric",
  ];

  // Update fields if provided
  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      if (
        field === "content" ||
        field === "hint" ||
        field === "explanation" ||
        field === "category"
      ) {
        // Trim string fields
        question[field] =
          typeof updateData[field] === "string" ? updateData[field].trim() : updateData[field];
      } else {
        question[field] = updateData[field];
      }
    }
  }

  // Validate question type if it was updated
  const validTypes = ["multiple_choice", "true_false", "short_answer", "essay"];
  if (!validTypes.includes(question.type)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  // Type-specific validation
  if (question.type === "multiple_choice") {
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có ít nhất 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (question.type === "true_false") {
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 2) {
      const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (question.type === "short_answer") {
    if (!question.correctAnswer) {
      const error = new Error("Câu hỏi trả lời ngắn phải có câu trả lời đúng");
      error.status = 400;
      throw error;
    }
  }

  // Update the question in the array
  examSet.questions[questionIndex] = question;

  // Recalculate metrics explicitly in service before save
  recalculateExamSetMetrics(examSet);

  // Save exam set
  const updatedExamSet = await examSet.save();

  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Reorder questions within an exam set
 * @param {string} examSetId
 * @param {string} ownerId
 * @param {Array} reorderItems
 * @returns {Object} Updated exam set
 */
export const reorderQuestionsInExamSetService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  reorderItems
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(reorderItems) || reorderItems.length === 0) {
    const error = new Error("Payload questions phải là một mảng và không được rỗng");
    error.status = 400;
    throw error;
  }

  const questionIdSet = new Set();
  const orderSet = new Set();
  const normalizedItems = reorderItems.map((item, index) => {
    if (!item || typeof item !== "object") {
      const error = new Error(`questions[${index}] phải là object chứa questionId và order`);
      error.status = 400;
      throw error;
    }

    const { questionId, order } = item;

    if (!questionId || typeof questionId !== "string" || questionId.trim() === "") {
      const error = new Error(`questions[${index}].questionId là bắt buộc`);
      error.status = 400;
      throw error;
    }

    if (
      order === undefined ||
      order === null ||
      typeof order !== "number" ||
      !Number.isInteger(order) ||
      order < 0
    ) {
      const error = new Error(`questions[${index}].order phải là số nguyên không âm`);
      error.status = 400;
      throw error;
    }

    const trimmedId = questionId.trim();
    if (questionIdSet.has(trimmedId)) {
      const error = new Error("Không được phép duplicate questionId trong payload");
      error.status = 400;
      throw error;
    }

    if (orderSet.has(order)) {
      const error = new Error("Không được phép duplicate order trong payload");
      error.status = 400;
      throw error;
    }

    questionIdSet.add(trimmedId);
    orderSet.add(order);

    return { questionId: trimmedId, order };
  });

  const examSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  const userRole = (currentUserRole || "").toLowerCase();
  const isOwner = examSet.ownerId.toString() === currentUserId;
  const hasEditPermission = ["admin", "teacher"].includes(userRole);

  if (!isOwner && !hasEditPermission) {
    const error = new Error("Bạn không có quyền sắp xếp lại câu hỏi");
    error.status = 403;
    throw error;
  }

  if (examSet.status !== "draft") {
    const error = new Error("Chỉ có thể sắp xếp lại câu hỏi khi bộ đề thi đang ở trạng thái draft");
    error.status = 403;
    throw error;
  }

  const existingQuestionIds = new Set(examSet.questions.map((q) => q.questionId));
  const reorderItemMap = new Map(normalizedItems.map((item) => [item.questionId, item.order]));

  for (const { questionId } of normalizedItems) {
    if (!existingQuestionIds.has(questionId)) {
      const error = new Error(`Câu hỏi ${questionId} không tồn tại trong bộ đề thi`);
      error.status = 404;
      throw error;
    }
  }

  const finalOrderSet = new Set();
  for (const question of examSet.questions) {
    const newOrder = reorderItemMap.has(question.questionId)
      ? reorderItemMap.get(question.questionId)
      : question.order;
    if (finalOrderSet.has(newOrder)) {
      const error = new Error("Không được phép duplicate order sau khi sắp xếp lại câu hỏi");
      error.status = 400;
      throw error;
    }
    finalOrderSet.add(newOrder);
  }

  examSet.questions = examSet.questions.map((question) => {
    const reorderItem = reorderItemMap.get(question.questionId);
    if (reorderItem !== undefined) {
      question.order = reorderItem;
    }
    return question;
  });

  examSet.questions.sort((a, b) => a.order - b.order);

  const updatedExamSet = await examSet.save();
  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Delete question from exam set
 * @param {string} examSetId
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @param {string} questionId
 * @returns {Object} Updated exam set
 */
export const deleteQuestionFromExamSetService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  questionId
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!questionId || typeof questionId !== "string" || questionId.trim() === "") {
    const error = new Error("questionId là bắt buộc");
    error.status = 400;
    throw error;
  }

  const normalizedQuestionId = questionId.trim();

  const examSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const userRole = (currentUserRole || "").toLowerCase();
  const isOwner = examSet.ownerId.toString() === currentUserId;
  const hasEditPermission = ["admin", "teacher"].includes(userRole);

  if (!isOwner && !hasEditPermission) {
    const error = new Error("Bạn không có quyền xóa câu hỏi");
    error.status = 403;
    throw error;
  }

  if (examSet.status === "published") {
    const error = new Error("Không thể xóa câu hỏi khi bộ đề thi đang ở trạng thái Published");
    error.status = 403;
    throw error;
  }

  const questionIndex = examSet.questions.findIndex((q) => q.questionId === normalizedQuestionId);
  if (questionIndex === -1) {
    const error = new Error("Câu hỏi không tồn tại trong bộ đề thi");
    error.status = 404;
    throw error;
  }

  examSet.questions.splice(questionIndex, 1);

  recalculateExamSetMetrics(examSet);

  const updatedExamSet = await examSet.save();
  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};
