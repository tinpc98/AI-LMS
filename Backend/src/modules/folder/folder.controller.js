// File: src/controllers/folder.controller.js
import {
  createFolderService,
  getFolderService,
  getFolderListService,
  updateFolderService,
  deleteFolderService,
  getFolderTreeService,
} from "./folder.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

/**
 * Create new folder
 * POST /api/folders
 * Body: { name, parentFolderId? }
 */
export const createFolder = asyncHandler(async (req, res) => {
  const { name, parentFolderId } = req.body;
  const userId = req.user.id; // From verifyUser middleware

  // Validate input
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên folder là bắt buộc",
    });
  }

  // Create folder
  const folder = await createFolderService(userId, name, parentFolderId);

  return res.status(201).json({
    success: true,
    message: "Tạo folder thành công",
    data: folder,
  });
});

/**
 * Get folder by ID
 * GET /api/folders/:id
 */
export const getFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From verifyUser middleware

  // Get folder
  const folder = await getFolderService(id, userId);

  return res.status(200).json({
    success: true,
    message: "Lấy folder thành công",
    data: folder,
  });
});

/**
 * Get all folders of current user
 * GET /api/folders
 * Query: page?, limit?, parentFolderId?
 */
export const getFolders = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From verifyUser middleware
  const { page = 1, limit = 10, parentFolderId } = req.query;

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

  // Get folders
  const result = await getFolderListService(userId, parentFolderId, pageNum, limitNum);

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách folder thành công",
    data: result.folders,
    pagination: result.pagination,
  });
});

/**
 * Update folder (only owner)
 * PATCH /api/folders/:id
 * Body: { name?, parentFolderId? }
 */
export const updateFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From verifyUser middleware
  const updateData = req.body;

  // Validate input
  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cần cung cấp ít nhất một trường để cập nhật",
    });
  }

  // Update folder
  const folder = await updateFolderService(id, userId, updateData);

  return res.status(200).json({
    success: true,
    message: "Cập nhật folder thành công",
    data: folder,
  });
});

/**
 * Delete folder (soft delete, only owner)
 * DELETE /api/folders/:id
 */
export const deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From verifyUser middleware

  // Delete folder
  const folder = await deleteFolderService(id, userId);

  return res.status(200).json({
    success: true,
    message: "Xóa folder thành công",
    data: folder,
  });
});

/**
 * Get folder tree structure
 * GET /api/folders/tree
 * Returns all folders in hierarchical tree structure
 */
export const getFolderTree = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From verifyUser middleware

  // Get folder tree
  const tree = await getFolderTreeService(userId);

  return res.status(200).json({
    success: true,
    message: "Lấy cây folder thành công",
    data: tree,
  });
});
