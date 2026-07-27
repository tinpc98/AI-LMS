// File: src/routers/examSet.routes.js
import express from "express";
import { createExamSet, getExamSets, getExamSetById, saveDraftExamSet, duplicateExamSet, createNewExamSetVersion, getExamSetVersions, restoreExamSetVersion, updateExamSet, updateExamSetTags, deleteExamSet, restoreExamSet, addQuestionToExamSet, updateQuestionInExamSet, deleteQuestionInExamSet, reorderQuestionsInExamSet, createExamSetShare, revokeExamSetShare, listExamSetShares } from "../controllers/examSet.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";
import { requireExamSetDraftAccess, requireExamSetEditAccess } from "../middlewares/examSetAccess.middlewares.js";
import { examSetQuestionCreateValidation, examSetQuestionUpdateValidation, reorderQuestionsValidation, examSetTagsValidation, examSetShareCreateValidation, examSetShareRevokeValidation, examSetShareListValidation } from "../utils/validators.js";
import { examSetVersionsValidation } from "../utils/validators.js";

const router = express.Router();

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
 * PATCH /api/exam-sets/:examSetId/save-draft
 * Save current draft data for an exam set
 */
router.patch("/:examSetId/save-draft", requireExamSetDraftAccess, saveDraftExamSet);

/**
 * POST /api/exam-sets/:examSetId/duplicate
 * Duplicate an existing exam set as a new draft owned by the current user
 */
router.post("/:examSetId/duplicate", requireExamSetEditAccess, duplicateExamSet);

/**
 * POST /api/exam-sets/:examSetId/new-version
 * Create a new version of the latest exam set
 */
router.post("/:examSetId/new-version", requireExamSetEditAccess, createNewExamSetVersion);

/**
 * POST /api/exam-sets/:examSetId/shares
 * Create or reactivate a share for an exam set
 */
router.post("/:examSetId/shares", requireExamSetEditAccess, examSetShareCreateValidation, createExamSetShare);

/**
 * PATCH /api/exam-sets/:examSetId/shares/:shareId/revoke
 * Revoke a share (Owner or Admin only)
 */
router.patch("/:examSetId/shares/:shareId/revoke", requireExamSetEditAccess, examSetShareRevokeValidation, revokeExamSetShare);

/**
 * GET /api/exam-sets/:examSetId/shares
 * Get share records for an exam set
 */
router.get("/:examSetId/shares", requireExamSetEditAccess, examSetShareListValidation, listExamSetShares);

/**
 * GET /api/exam-sets/:examSetId/versions
 * Get version history for the exam set lineage
 */
router.get("/:examSetId/versions", requireExamSetEditAccess, examSetVersionsValidation, getExamSetVersions);

/**
 * POST /api/exam-sets/:examSetId/restore
 * Create a new draft version cloned from an older version (restore)
 */
router.post("/:examSetId/restore", requireExamSetEditAccess, restoreExamSetVersion);

/**
 * GET /api/exam-sets/:id
 * Get detailed exam set
 */
router.get("/:id", getExamSetById);

/**
 * POST /api/exam-sets/:id/questions
 * Add question to exam set
 * Body: { questionId, type, content, points?, ... }
 */
router.post("/:id/questions", requireExamSetEditAccess, examSetQuestionCreateValidation, addQuestionToExamSet);

/**
 * PATCH /api/exam-sets/:id/questions/:questionId
 * Update question in exam set
 * Body: { type?, content?, points?, difficulty?, options?, ... }
 */
router.patch("/:id/questions/:questionId", requireExamSetEditAccess, examSetQuestionUpdateValidation, updateQuestionInExamSet);

/**
 * PATCH /api/exam-sets/:id/questions/reorder
 * Reorder questions within exam set
 */
router.patch("/:id/questions/reorder", requireExamSetEditAccess, reorderQuestionsValidation, reorderQuestionsInExamSet);

/**
 * DELETE /api/exam-sets/:id/questions/:questionId
 * Delete question in exam set
 */
router.delete("/:id/questions/:questionId", requireExamSetEditAccess, deleteQuestionInExamSet);

/**
 * PATCH /api/exam-sets/:id
 * Update exam set (only owner, not published)
 * Body: { title?, description?, tags?, folderId? }
 */
router.patch("/:id", requireExamSetEditAccess, updateExamSet);

/**
 * PATCH /api/exam-sets/:examSetId/tags
 * Update only tags for the exam set
 * Body: { tags }
 */
router.patch("/:examSetId/tags", requireExamSetEditAccess, examSetTagsValidation, updateExamSetTags);

/**
 * DELETE /api/exam-sets/:id
 * Delete exam set (soft delete, only owner)
 */
router.delete("/:id", requireExamSetEditAccess, deleteExamSet);

/**
 * PATCH /api/exam-sets/:id/restore
 * Restore exam set (undo soft delete, only owner)
 */
router.patch("/:id/restore", requireExamSetEditAccess, restoreExamSet);

export default router;
