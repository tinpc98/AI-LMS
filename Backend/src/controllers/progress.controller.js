import mongoose from "mongoose";
import progressService from "../services/progress.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/progress/mark-lesson-complete
 * Đánh dấu bài giảng đã hoàn thành
 */
export const markLessonComplete = async (req, res) => {
  try {
    const { lessonId, classId } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return sendError(res, "ID bài giảng không hợp lệ!", 400);
    }
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const result = await progressService.markLessonComplete(studentId, classId, lessonId);

    return sendSuccess(
      res,
      "Đã đánh dấu hoàn thành bài giảng",
      result
    );
  } catch (error) {
    console.error("[ProgressController] markLessonComplete Error:", error);
    return sendError(
      res,
      error.message || "Lỗi khi đánh dấu bài giảng hoàn thành",
      500
    );
  }
};

/**
 * GET /api/progress/student/:studentId/class/:classId
 * Lấy thông tin tiến độ học tập
 */
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId, classId } = req.params;
    const userRole = (req.user?.role || "").toLowerCase();
    const loggedUserId = (req.user?.id || req.user?._id || "").toString();

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return sendError(res, "ID học sinh không hợp lệ!", 400);
    }
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    // Học sinh chỉ được xem tiến độ của chính mình
    if (userRole === "student" && loggedUserId !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cannot access other student's progress."
      });
    }

    const metrics = await progressService.getStudentProgress(studentId, classId);

    return sendSuccess(
      res,
      "Lấy thông tin tiến độ thành công",
      metrics
    );
  } catch (error) {
    console.error("[ProgressController] getStudentProgress Error:", error);
    return sendError(
      res,
      error.message || "Lỗi khi lấy thông tin tiến độ học tập",
      500
    );
  }
};
