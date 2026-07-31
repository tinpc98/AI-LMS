// File: src/routes/folder.routes.js
import express from "express";
import {
  createFolder,
  getFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  getFolderTree,
} from "../controllers/folder.controller.js";
import { verifyUser } from "#modules/auth";

const router = express.Router();

// All routes require authentication
router.use(verifyUser);

/**
 * POST /api/folders
 * Create new folder
 * Body: { name, parentFolderId? }
 */
router.post("/", createFolder);

/**
 * GET /api/folders
 * Get all folders of current user
 * Query: page?, limit?, parentFolderId?
 */
router.get("/", getFolders);

/**
 * GET /api/folders/tree
 * Get folder tree structure (hierarchical)
 * Should be BEFORE /:id route to avoid conflict
 */
router.get("/tree", getFolderTree);

/**
 * GET /api/folders/:id
 * Get folder by ID (only owner can access)
 */
router.get("/:id", getFolder);

/**
 * PATCH /api/folders/:id
 * Update folder (only owner)
 * Body: { name?, parentFolderId? }
 */
router.patch("/:id", updateFolder);

/**
 * DELETE /api/folders/:id
 * Delete folder (soft delete, only owner)
 */
router.delete("/:id", deleteFolder);

export default router;
