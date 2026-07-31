// File: src/services/folder.service.js
import Folder from "../models/folder.model.js";

/**
 * Create new folder
 * @param {string} ownerId - Owner user ID
 * @param {string} name - Folder name
 * @param {string|null} parentFolderId - Parent folder ID (null for root)
 * @returns {Object} Created folder
 */
export const createFolderService = async (ownerId, name, parentFolderId = null) => {
  // Validate inputs
  if (!ownerId || !name) {
    const error = new Error("ownerId và name là bắt buộc");
    error.status = 400;
    throw error;
  }

  // If parentFolderId is provided, verify it exists and belongs to the same owner
  if (parentFolderId) {
    const parentFolder = await Folder.findOne({
      _id: parentFolderId,
      ownerId: ownerId,
      isDeleted: false,
    });

    if (!parentFolder) {
      const error = new Error("Folder cha không tồn tại hoặc bạn không có quyền truy cập");
      error.status = 404;
      throw error;
    }
  }

  // Create new folder
  const newFolder = new Folder({
    ownerId,
    name: name.trim(),
    parentFolderId: parentFolderId || null,
  });

  await newFolder.save();
  return newFolder;
};

/**
 * Get folder by ID
 * @param {string} folderId - Folder ID
 * @param {string} userId - Current user ID (for ownership check)
 * @returns {Object} Folder data
 */
export const getFolderService = async (folderId, userId) => {
  const folder = await Folder.findOne({
    _id: folderId,
    ownerId: userId,
    isDeleted: false,
  }).populate("parentFolderId", "name");

  if (!folder) {
    const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  return folder;
};

/**
 * Get all folders of a user
 * @param {string} userId - Owner user ID
 * @param {string|null} parentFolderId - Filter by parent folder (optional)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated folders
 */
export const getFolderListService = async (
  userId,
  parentFolderId = null,
  page = 1,
  limit = 10
) => {
  const query = {
    ownerId: userId,
    isDeleted: false,
  };

  if (parentFolderId) {
    query.parentFolderId = parentFolderId;
  } else {
    query.parentFolderId = null;
  }

  const skip = (page - 1) * limit;

  const [folders, total] = await Promise.all([
    Folder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("parentFolderId", "name"),
    Folder.countDocuments(query),
  ]);

  return {
    folders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update folder
 * @param {string} folderId - Folder ID
 * @param {string} userId - Current user ID (for ownership check)
 * @param {Object} updateData - Data to update (name, parentFolderId)
 * @returns {Object} Updated folder
 */
export const updateFolderService = async (folderId, userId, updateData) => {
  // Verify ownership
  const folder = await Folder.findOne({
    _id: folderId,
    ownerId: userId,
    isDeleted: false,
  });

  if (!folder) {
    const error = new Error("Folder không tồn tại hoặc bạn không có quyền sửa");
    error.status = 404;
    throw error;
  }

  // Validate update data
  const allowedFields = ["name", "parentFolderId"];
  const updateFields = {};

  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  }

  // If updating parent folder, verify it exists and belongs to the same owner
  if (updateFields.parentFolderId) {
    const parentFolder = await Folder.findOne({
      _id: updateFields.parentFolderId,
      ownerId: userId,
      isDeleted: false,
    });

    if (!parentFolder) {
      const error = new Error("Folder cha không tồn tại hoặc bạn không có quyền truy cập");
      error.status = 404;
      throw error;
    }

    // Prevent circular reference (folder cannot be parent of itself)
    if (updateFields.parentFolderId.toString() === folderId) {
      const error = new Error("Folder không thể là folder cha của chính nó");
      error.status = 400;
      throw error;
    }
  }

  // Normalize name if provided
  if (updateFields.name) {
    updateFields.name = updateFields.name.trim();
  }

  // Update folder
  const updatedFolder = await Folder.findByIdAndUpdate(folderId, updateFields, {
    new: true,
    runValidators: true,
  }).populate("parentFolderId", "name");

  return updatedFolder;
};

/**
 * Delete folder (soft delete)
 * @param {string} folderId - Folder ID
 * @param {string} userId - Current user ID (for ownership check)
 * @returns {Object} Deleted folder
 */
export const deleteFolderService = async (folderId, userId) => {
  // Verify ownership
  const folder = await Folder.findOne({
    _id: folderId,
    ownerId: userId,
    isDeleted: false,
  });

  if (!folder) {
    const error = new Error("Folder không tồn tại hoặc bạn không có quyền xóa");
    error.status = 404;
    throw error;
  }

  // Soft delete the folder
  folder.isDeleted = true;
  await folder.save();

  return folder;
};

/**
 * Hard delete folder (admin only)
 * @param {string} folderId - Folder ID
 * @returns {Object} Deleted folder
 */
export const hardDeleteFolderService = async (folderId) => {
  const folder = await Folder.findByIdAndDelete(folderId);

  if (!folder) {
    const error = new Error("Folder không tồn tại");
    error.status = 404;
    throw error;
  }

  return folder;
};

/**
 * Get folder tree for current user
 * Returns all folders in tree structure (parent-child hierarchy)
 * @param {string} userId - Current user ID
 * @returns {Array} Array of root folders with nested children
 */
export const getFolderTreeService = async (userId) => {
  // Fetch all folders belonging to this user (not deleted)
  const allFolders = await Folder.find({
    ownerId: userId,
    isDeleted: false,
  }).lean(); // Use lean() for better performance

  if (allFolders.length === 0) {
    return [];
  }

  // Convert folder array to map for quick lookup
  const folderMap = new Map();
  const rootFolders = [];

  allFolders.forEach((folder) => {
    folderMap.set(folder._id.toString(), {
      ...folder,
      children: [],
    });
  });

  // Build tree structure
  allFolders.forEach((folder) => {
    const folderId = folder._id.toString();
    const parentId = folder.parentFolderId?.toString();

    if (!parentId) {
      // Root folder
      rootFolders.push(folderMap.get(folderId));
    } else {
      // Add to parent's children
      const parent = folderMap.get(parentId);
      if (parent) {
        parent.children.push(folderMap.get(folderId));
      }
    }
  });

  // Sort by name
  const sortByName = (arr) => {
    arr.sort((a, b) => a.name.localeCompare(b.name));
    arr.forEach((folder) => {
      if (folder.children && folder.children.length > 0) {
        sortByName(folder.children);
      }
    });
  };

  sortByName(rootFolders);

  return rootFolders;
};
