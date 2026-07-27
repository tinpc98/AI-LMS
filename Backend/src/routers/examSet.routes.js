// File: src/routers/examSet.routes.js
import express from "express";
import { createExamSet } from "../controllers/examSet.controller.js";
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

export default router;
