// File: src/modules/exam-set/examSetVersion.service.js
// Nghiệp vụ PHIÊN BẢN bộ đề: xem lịch sử phiên bản, tạo phiên bản mới, khôi phục về
// một phiên bản cũ.
//
// Tách từ examSet.service.js ở Wave 4.1 — bước 2/7.
//
// Khác với nhóm share (bước 1) vốn nằm liền một khối, ba hàm này nằm RẢI RÁC ở ba đoạn
// khác nhau trong file gốc. Đã phân tích trước khi cắt: nhóm này không dùng bất kỳ helper
// nào của phần còn lại.
//
// Lưu ý một điểm dễ nhầm: helper initializeVersionMetadata() nghe như thuộc nhóm version,
// nhưng thực tế chỉ được duplicateExamSetService và createExamSetService dùng, KHÔNG phải
// ba hàm ở đây. Vì vậy nó ở lại file gốc.
//
// Nội dung giữ NGUYÊN VĂN, chỉ thay danh sách import.
import { Types } from "mongoose";
import ExamSet from "./examSet.model.js";
import { Folder } from "#modules/folder";
import { recalculateExamSetMetrics } from "./examSet.metrics.js";

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
