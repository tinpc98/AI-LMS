// File: src/routers/examSet.routes.js
import express from "express";
import {
  createExamSet,
  getExamSets,
  getExamSetById,
  saveDraftExamSet,
  duplicateExamSet,
  createNewExamSetVersion,
  getExamSetVersions,
  restoreExamSetVersion,
  updateExamSet,
  updateExamSetTags,
  deleteExamSet,
  restoreExamSet,
  addQuestionToExamSet,
  updateQuestionInExamSet,
  deleteQuestionInExamSet,
  reorderQuestionsInExamSet,
  createExamSetShare,
  revokeExamSetShare,
  listExamSetShares,
  listSharedExamSets,
  updateExamSetShareMetadata,
  importExcelExamSet,
} from "../controllers/examSet.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
import {
  requireExamSetDraftAccess,
  requireExamSetEditAccess,
  requireExamSetAccess,
} from "../middlewares/examSetAccess.middlewares.js";
import {
  examSetQuestionCreateValidation,
  examSetQuestionUpdateValidation,
  reorderQuestionsValidation,
  examSetTagsValidation,
  examSetShareCreateValidation,
  examSetShareRevokeValidation,
  examSetShareListValidation,
  examSetSharedWithMeValidation,
  examSetShareUpdateMetadataValidation,
} from "../utils/validators.js";
import { examSetVersionsValidation } from "../utils/validators.js";
import multer from "multer";

const router = express.Router();

// Multer Config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.match(/\.(xlsx|xls)$/)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép file Excel (.xlsx, .xls)"), false);
    }
  },
});

// All routes require authentication
router.use(verifyUser);

/**
 * POST /api/exam-sets
 * Create new exam set
 * Body: { folderId, title, description?, tags? }
 */
router.post("/", createExamSet);

/**
 * GET /api/exam-sets
 * Get exam sets with filters
 * Query: folderId?, status?, page?, limit?
 */
router.get("/", getExamSets);

/**
 * POST /api/exam-sets/import-excel
 * Import exam set from Excel file
 * Access: Teacher, Admin
 */
router.post(
  "/import-excel",
  isTeacher,
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err) {
        return res.status(415).json({ success: false, message: err.message });
      }
      next();
    });
  },
  importExcelExamSet
);

/**
 * PATCH /api/exam-sets/:examSetId/save-draft
 * Save current draft data for an exam set
 * Access: Owner, Admin, Shared EDIT
 */
router.patch(
  "/:examSetId/save-draft",
  requireExamSetAccess("EDIT"),
  saveDraftExamSet
);

/**
 * POST /api/exam-sets/:examSetId/duplicate
 * Duplicate an existing exam set as a new draft owned by the current user
 * Access: Owner, Admin only
 */
router.post(
  "/:examSetId/duplicate",
  requireExamSetEditAccess,
  duplicateExamSet
);

/**
 * POST /api/exam-sets/:examSetId/new-version
 * Create a new version of the latest exam set
 * Access: Owner, Admin only
 */
router.post(
  "/:examSetId/new-version",
  requireExamSetEditAccess,
  createNewExamSetVersion
);

/**
 * POST /api/exam-sets/:examSetId/shares
 * Create or reactivate a share for an exam set
 * Access: Owner, Admin only – shared user không được share tiếp
 */
router.post(
  "/:examSetId/shares",
  requireExamSetEditAccess,
  examSetShareCreateValidation,
  createExamSetShare
);

/**
 * PATCH /api/exam-sets/:examSetId/shares/:shareId
 * Update share metadata: expiresAt and/or note
 * Access: Owner, Admin only
 * Must be placed BEFORE /:examSetId/shares/:shareId/revoke to avoid route conflict
 */
router.patch(
  "/:examSetId/shares/:shareId",
  requireExamSetEditAccess,
  examSetShareUpdateMetadataValidation,
  updateExamSetShareMetadata
);

/**
 * PATCH /api/exam-sets/:examSetId/shares/:shareId/revoke
 * Revoke a share (Owner or Admin only)
 */
router.patch(
  "/:examSetId/shares/:shareId/revoke",
  requireExamSetEditAccess,
  examSetShareRevokeValidation,
  revokeExamSetShare
);

/**
 * GET /api/exam-sets/shared-with-me
 * Get exam sets shared with current authenticated user
 */
router.get("/shared-with-me", examSetSharedWithMeValidation, listSharedExamSets);

/**
 * GET /api/exam-sets/:examSetId/shares
 * Get share records for an exam set
 * Access: Owner, Admin only – danh sách share là metadata nhạy cảm
 */
router.get(
  "/:examSetId/shares",
  requireExamSetEditAccess,
  examSetShareListValidation,
  listExamSetShares
);

/**
 * GET /api/exam-sets/:examSetId/versions
 * Get version history for the exam set lineage
 * Access: Owner, Admin only
 */
router.get(
  "/:examSetId/versions",
  requireExamSetEditAccess,
  examSetVersionsValidation,
  getExamSetVersions
);

/**
 * POST /api/exam-sets/:examSetId/restore
 * Create a new draft version cloned from an older version (restore)
 * Access: Owner, Admin only
 */
router.post(
  "/:examSetId/restore",
  requireExamSetEditAccess,
  restoreExamSetVersion
);

/**
 * GET /api/exam-sets/:id
 * Get detailed exam set
 * Access: Owner, Admin, Shared VIEW, Shared EDIT
 */
router.get("/:id", requireExamSetAccess("VIEW"), getExamSetById);

/**
 * POST /api/exam-sets/:id/questions
 * Add question to exam set
 * Body: { questionId, type, content, points?, ... }
 * Access: Owner, Admin, Shared EDIT
 */
router.post(
  "/:id/questions",
  requireExamSetAccess("EDIT"),
  examSetQuestionCreateValidation,
  addQuestionToExamSet
);

/**
 * PATCH /api/exam-sets/:id/questions/:questionId
 * Update question in exam set
 * Body: { type?, content?, points?, difficulty?, options?, ... }
 * Access: Owner, Admin, Shared EDIT
 */
router.patch(
  "/:id/questions/:questionId",
  requireExamSetAccess("EDIT"),
  examSetQuestionUpdateValidation,
  updateQuestionInExamSet
);

/**
 * PATCH /api/exam-sets/:id/questions/reorder
 * Reorder questions within exam set
 * Access: Owner, Admin, Shared EDIT
 */
router.patch(
  "/:id/questions/reorder",
  requireExamSetAccess("EDIT"),
  reorderQuestionsValidation,
  reorderQuestionsInExamSet
);

/**
 * DELETE /api/exam-sets/:id/questions/:questionId
 * Delete question in exam set
 * Access: Owner, Admin, Shared EDIT
 */
router.delete(
  "/:id/questions/:questionId",
  requireExamSetAccess("EDIT"),
  deleteQuestionInExamSet
);

/**
 * PATCH /api/exam-sets/:id
 * Update exam set (only owner, not published)
 * Body: { title?, description?, tags?, folderId? }
 * Access: Owner, Admin, Shared EDIT
 */
router.patch("/:id", requireExamSetAccess("EDIT"), updateExamSet);

/**
 * PATCH /api/exam-sets/:examSetId/tags
 * Update only tags for the exam set
 * Body: { tags }
 * Access: Owner, Admin, Shared EDIT
 */
router.patch(
  "/:examSetId/tags",
  requireExamSetAccess("EDIT"),
  examSetTagsValidation,
  updateExamSetTags
);

/**
 * DELETE /api/exam-sets/:id
 * Delete exam set (soft delete, only owner)
 * Access: Owner, Admin only
 */
router.delete("/:id", requireExamSetEditAccess, deleteExamSet);

/**
 * PATCH /api/exam-sets/:id/restore
 * Restore exam set (undo soft delete, only owner)
 * Access: Owner, Admin only
 */
router.patch("/:id/restore", requireExamSetEditAccess, restoreExamSet);

export default router;
