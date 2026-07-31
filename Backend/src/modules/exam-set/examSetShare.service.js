// File: src/modules/exam-set/examSetShare.service.js
// Nghiệp vụ CHIA SẺ bộ đề: tạo, thu hồi, cập nhật metadata, liệt kê chia sẻ, và
// liệt kê bộ đề được chia sẻ với mình.
//
// Tách từ examSet.service.js ở Wave 4.1 — bước 1/7 của việc chẻ god service 2.478 dòng.
// Chọn nhóm share làm bước đầu theo đúng chỉ định của §4.1: đây là nhóm có lưới an toàn
// dày nhất (5 file test riêng), và khi phân tích thì thấy nó TỰ CHỨA hoàn toàn — không
// dùng bất kỳ helper nào của phần còn lại, và helper escapeRegex của nó cũng không bị
// phần nào khác dùng tới.
//
// Nội dung dưới đây giữ NGUYÊN VĂN từ file gốc, chỉ thay đổi danh sách import.
import { Types } from "mongoose";
import ExamSet from "./examSet.model.js";
import ExamSetShare, { EXAM_SET_SHARE_STATUS } from "./examSetShare.model.js";
import { User } from "#modules/auth";
import * as examSetRepo from "./examSet.repository.js";
import * as shareRepo from "./examSetShare.repository.js";

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

  const examSet = await examSetRepo.findActiveExamSet(examSetId);
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
  const recipient = await shareRepo.findUserById(sharedWithUserId);
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
  const existing = await shareRepo.findShareByExamSetAndUser(examSetId, sharedWithUserId);

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

  const examSet = await examSetRepo.findActiveExamSet(examSetId);
  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const share = await shareRepo.findShareById(shareId);
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
  const examSet = await examSetRepo.findActiveExamSet(examSetId);
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
  const share = await shareRepo.findShareByIdInExamSet(shareId, examSet._id);

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

  const examSet = await examSetRepo.findActiveExamSet(examSetId);
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
