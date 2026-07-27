// File: src/middlewares/examSetAccess.middlewares.js
import { Types } from "mongoose";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare, { EXAM_SET_SHARE_STATUS } from "../models/examSetShare.model.js";

/**
 * Permission level map – dùng để so sánh hierarchy.
 * EDIT bao gồm VIEW (2 >= 1).
 * Không so sánh string theo alphabet.
 */
const PERMISSION_LEVEL = {
  VIEW: 1,
  EDIT: 2,
};

/**
 * Helper nội bộ: attach examSet + examSetAccess vào req.
 * Không export trực tiếp.
 */
const attachExamSetToRequest = async (req, res, next, allowUnauthorizedAs403 = false) => {
  try {
    const examSetId = req.params.examSetId || req.params.id;

    if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({
        success: false,
        message: "examSetId không hợp lệ",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
      });
    }

    const examSet = await ExamSet.findOne({
      _id: examSetId,
      isDeleted: false,
    });

    if (!examSet) {
      return res.status(404).json({
        success: false,
        message: "Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập",
      });
    }

    const userId = String(req.user.id);
    const userRole = String(req.user.role || "").toLowerCase();
    const isOwner = String(examSet.ownerId?._id || examSet.ownerId) === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      if (allowUnauthorizedAs403) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền lưu bản nháp cho bộ đề thi này",
        });
      }

      return res.status(404).json({
        success: false,
        message: "Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập",
      });
    }

    req.examSet = examSet;
    next();
  } catch (error) {
    console.error("[ExamSet Access Middleware] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực quyền truy cập bộ đề thi",
    });
  }
};

/**
 * Middleware kiểm tra quyền chỉnh sửa Exam Set
 * - Owner được phép
 * - Admin được phép theo RBAC hiện tại
 * - User khác trả về 404 để tránh tiết lộ tồn tại resource
 */
export const requireExamSetEditAccess = async (req, res, next) => {
  return attachExamSetToRequest(req, res, next, false);
};

/**
 * Middleware kiểm tra quyền lưu bản nháp Exam Set
 * - Owner được phép
 * - Admin được phép theo RBAC hiện tại
 * - User khác trả về 403
 */
export const requireExamSetDraftAccess = async (req, res, next) => {
  return attachExamSetToRequest(req, res, next, true);
};

/**
 * Middleware factory kiểm tra quyền truy cập Exam Set theo share permission.
 *
 * Hỗ trợ 5 trường hợp:
 * 1. Admin → EDIT
 * 2. Owner → EDIT
 * 3. Shared EDIT → EDIT (và VIEW)
 * 4. Shared VIEW → VIEW only
 * 5. Không có quyền → 403
 *
 * Permission hierarchy: EDIT (2) ⊃ VIEW (1)
 *
 * Share hợp lệ phải có:
 * - examSetId đúng
 * - sharedWithUserId = currentUser._id
 * - status = ACTIVE
 * - expiresAt = null HOẶC expiresAt > now
 *
 * @param {"VIEW"|"EDIT"} requiredPermission - Mức quyền yêu cầu
 * @param {{ paramName?: string }} [options]   - Tùy chọn: override tên route param
 *
 * @example
 *   router.get("/:id", requireExamSetAccess("VIEW"), getExamSetById);
 *   router.patch("/:id", requireExamSetAccess("EDIT"), updateExamSet);
 *
 * Sau khi pass, gắn vào req:
 *   req.examSetAccess = { examSet, accessType, permission, shareId }
 *   req.examSet = examSet  // backward compat với controller cũ
 */
export const requireExamSetAccess = (requiredPermission, options = {}) => {
  // Validate requiredPermission khi khởi tạo route (fail-fast)
  if (!PERMISSION_LEVEL[requiredPermission]) {
    throw new Error(
      `[requireExamSetAccess] requiredPermission không hợp lệ: "${requiredPermission}". Chỉ chấp nhận "VIEW" hoặc "EDIT".`
    );
  }

  return async (req, res, next) => {
    try {
      // ─── Step 1: Lấy examSetId từ route params ───────────────────────────
      const paramName = options.paramName || null;
      const examSetId = paramName
        ? req.params[paramName]
        : req.params.examSetId || req.params.id;

      // ─── Step 2: Validate ObjectId ────────────────────────────────────────
      if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
        return res.status(400).json({
          success: false,
          message: "examSetId không hợp lệ",
        });
      }

      // ─── Step 3: Lấy current user từ auth middleware ──────────────────────
      // Middleware này phải chạy SAU verifyUser.
      // Không decode JWT lại. Không lấy userId từ body/query.
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Bạn chưa đăng nhập",
        });
      }

      // ─── Step 4: Tìm Exam Set ─────────────────────────────────────────────
      const examSet = await ExamSet.findOne(
        { _id: examSetId, isDeleted: false },
        {
          _id: 1,
          ownerId: 1,
          title: 1,
          description: 1,
          status: 1,
          folderId: 1,
          tags: 1,
          questions: 1,
          questionCount: 1,
          totalPoints: 1,
          versionNumber: 1,
          version: 1,
          rootExamSetId: 1,
          previousVersionId: 1,
          isLatestVersion: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      );

      // ─── Step 5: Kiểm tra soft delete / không tồn tại ────────────────────
      if (!examSet) {
        return res.status(404).json({
          success: false,
          message: "Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập",
        });
      }

      const userId = String(req.user.id);
      const userRole = String(req.user.role || "").toLowerCase();

      // ─── Step 6: Kiểm tra Admin ───────────────────────────────────────────
      const isAdmin = userRole === "admin";

      // ─── Step 7: Kiểm tra Owner ───────────────────────────────────────────
      // ownerId có thể là ObjectId hoặc populated object
      const isOwner =
        String(examSet.ownerId?._id || examSet.ownerId) === userId;

      // ─── Step 8: Admin / Owner → EDIT unconditionally ────────────────────
      if (isAdmin || isOwner) {
        // Gắn access context. Admin/Owner luôn có quyền EDIT.
        req.examSetAccess = {
          examSet,
          accessType: isOwner ? "OWNER" : "ADMIN",
          permission: "EDIT",
          shareId: null,
        };
        // Backward compatibility – controller cũ dùng req.examSet
        req.examSet = examSet;
        return next();
      }

      // ─── Step 9: Tìm ExamSetShare hợp lệ ────────────────────────────────
      // Chỉ query khi user không phải Owner/Admin (tối ưu performance).
      // Filter khóa theo currentUser – không tin query/body.
      // Không update trạng thái ở đây.
      const now = new Date();
      const share = await ExamSetShare.findOne(
        {
          examSetId: examSet._id,             // khóa theo examSetId đúng
          sharedWithUserId: userId,           // khóa theo currentUser
          status: EXAM_SET_SHARE_STATUS.ACTIVE,
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
        { _id: 1, permission: 1 }             // projection tối thiểu
      );

      // Không có share hợp lệ → 403
      // Dùng message chung, không tiết lộ lý do cụ thể (revoke/expired/etc.)
      if (!share) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập bộ đề thi này",
        });
      }

      // ─── Step 10: So sánh permission hierarchy ───────────────────────────
      // EDIT (2) >= VIEW (1): shared EDIT đủ điều kiện VIEW.
      // Shared VIEW không đủ điều kiện EDIT.
      const shareLevel = PERMISSION_LEVEL[share.permission] ?? 0;
      const requiredLevel = PERMISSION_LEVEL[requiredPermission];

      if (shareLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập bộ đề thi này",
        });
      }

      // ─── Step 11: Gắn access context vào req ─────────────────────────────
      // Chỉ gắn permission thực tế của share, không nâng lên EDIT.
      req.examSetAccess = {
        examSet,
        accessType: "SHARED",
        permission: share.permission,   // "VIEW" hoặc "EDIT"
        shareId: share._id,
      };
      // Backward compatibility
      req.examSet = examSet;

      // ─── Step 12: Gọi next() ─────────────────────────────────────────────
      return next();
    } catch (error) {
      console.error("[requireExamSetAccess] Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi xác thực quyền truy cập bộ đề thi",
      });
    }
  };
};
