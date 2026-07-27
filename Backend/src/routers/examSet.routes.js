// File: src/routers/examSet.routes.js
import express from "express";
import { createExamSet, getExamSets, updateExamSet, deleteExamSet, restoreExamSet, addQuestionToExamSet, updateQuestionInExamSet, deleteQuestionInExamSet, reorderQuestionsInExamSet } from "../controllers/examSet.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";
import { examSetQuestionCreateValidation, examSetQuestionUpdateValidation, reorderQuestionsValidation } from "../utils/validators.js";

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
 * POST /api/exam-sets/:id/questions
 * Add question to exam set
 * Body: { questionId, type, content, points?, ... }
 */
router.post("/:id/questions", examSetQuestionCreateValidation, addQuestionToExamSet);

/**
 * PATCH /api/exam-sets/:id/questions/:questionId
 * Update question in exam set
 * Body: { type?, content?, points?, difficulty?, options?, ... }
 */
router.patch("/:id/questions/:questionId", examSetQuestionUpdateValidation, updateQuestionInExamSet);

/**
 * PATCH /api/exam-sets/:id/questions/reorder
 * Reorder questions within exam set
 */
router.patch("/:id/questions/reorder", reorderQuestionsValidation, reorderQuestionsInExamSet);

/**
 * DELETE /api/exam-sets/:id/questions/:questionId
 * Delete question in exam set
 */
router.delete("/:id/questions/:questionId", deleteQuestionInExamSet);

/**
 * PATCH /api/exam-sets/:id
 * Update exam set (only owner, not published)
 * Body: { title?, description?, tags?, folderId? }
 */
router.patch("/:id", updateExamSet);

/**
 * DELETE /api/exam-sets/:id
 * Delete exam set (soft delete, only owner)
 */
router.delete("/:id", deleteExamSet);

/**
 * PATCH /api/exam-sets/:id/restore
 * Restore exam set (undo soft delete, only owner)
 */
router.patch("/:id/restore", restoreExamSet);

export default router;
