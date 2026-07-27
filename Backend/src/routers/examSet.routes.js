// File: src/routers/examSet.routes.js
import express from "express";
import { createExamSet, getExamSets, updateExamSet } from "../controllers/examSet.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";

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
 * PATCH /api/exam-sets/:id
 * Update exam set (only owner, not published)
 * Body: { title?, description?, tags?, folderId? }
 */
router.patch("/:id", updateExamSet);

export default router;
