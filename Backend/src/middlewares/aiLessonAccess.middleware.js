import { Lesson } from "#modules/lesson";
import { Class } from "#modules/class";
import { AIError, AIErrorCode } from "../utils/aiError.js";

/**
 * Middleware kiểm tra quyền truy cập vào AI Summary của Lesson
 */
export const checkAILessonAccess = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();
    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AIError("Thiếu lessonId trong request.", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson || lesson.isDeleted) {
      throw new AIError(
        "Bài giảng không tồn tại hoặc đã bị xóa.",
        AIErrorCode.AI_INVALID_INPUT,
        404
      );
    }

    const classDoc = await Class.findById(lesson.classId).lean();
    if (!classDoc || classDoc.isDeleted) {
      throw new AIError(
        "Lớp học chứa bài giảng này không tồn tại.",
        AIErrorCode.AI_INVALID_INPUT,
        404
      );
    }

    req.aiLesson = lesson; // Lưu lại để controller sử dụng
    req.aiClass = classDoc;

    // Admin có toàn quyền
    if (userRole === "admin") {
      return next();
    }

    // Teacher check
    if (userRole === "teacher") {
      if (String(classDoc.teacherId) === String(userId)) {
        return next();
      }
      throw new AIError(
        "Bạn không phải là giáo viên phụ trách lớp học này.",
        AIErrorCode.AI_FEATURE_DISABLED,
        403
      );
    }

    // Student check
    if (userRole === "student") {
      // 1. Lesson must be published
      if (!lesson.isPublished) {
        throw new AIError(
          "Bài giảng này chưa được xuất bản.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }

      // 2. Student must be enrolled in class
      const isEnrolled =
        classDoc.students &&
        classDoc.students.some(
          (s) => String(s.studentId) === String(userId) && s.status === "Enrolled"
        );

      if (!isEnrolled) {
        throw new AIError(
          "Bạn không phải là học sinh hợp lệ của lớp học này.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }

      // 3. Prevent generating/approving/rejecting
      if (req.method !== "GET") {
        throw new AIError(
          "Học sinh không có quyền thực hiện thao tác này.",
          AIErrorCode.AI_FEATURE_DISABLED,
          403
        );
      }

      return next();
    }

    throw new AIError("Vai trò không hợp lệ.", AIErrorCode.AI_FEATURE_DISABLED, 403);
  } catch (error) {
    if (error instanceof AIError) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    console.error("[checkAILessonAccess] Error:", error);
    return res.status(500).json({
      success: false,
      code: AIErrorCode.AI_PROVIDER_ERROR,
      message: "Lỗi hệ thống khi kiểm tra quyền truy cập bài giảng.",
    });
  }
};
