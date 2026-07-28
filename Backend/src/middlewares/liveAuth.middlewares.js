import mongoose from "mongoose";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import { LIVE_ERROR_CODES, sendLiveError } from "../validators/live.validator.js";

/**
 * Middleware kiểm tra quyền Quyền sở hữu Lớp học dành cho Giáo viên (Teacher Owner Check)
 * QUYẾT ĐỊNH CHÍNH THỨC: Admin KHÔNG ĐƯỢC PHÉP vận hành Live Session.
 */
export const checkClassTeacherOwnership = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();

    // 1. Quản trị viên (Admin) bị CHẶN HOÀN TOÀN khỏi Session Plane
    if (userRole === "admin") {
      return sendLiveError(
        res,
        403,
        LIVE_ERROR_CODES.ADMIN_OPERATION_NOT_ALLOWED,
        "Quản trị viên không được phép vận hành buổi học trực tuyến."
      );
    }

    let classId = req.params.classId || req.body.classId;
    const { sessionId } = req.params;

    if (!classId && sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return sendLiveError(
          res,
          400,
          LIVE_ERROR_CODES.INVALID_SESSION_ID,
          "sessionId không hợp lệ!"
        );
      }
      const session = await LiveSession.findById(sessionId).select("classId status isDeleted");
      if (!session || session.isDeleted) {
        return sendLiveError(
          res,
          404,
          LIVE_ERROR_CODES.SESSION_NOT_FOUND,
          "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!"
        );
      }
      classId = session.classId?.toString();
      req.liveSession = session;
    }

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendLiveError(
        res,
        400,
        LIVE_ERROR_CODES.INVALID_CLASS_ID,
        "ID lớp học không hợp lệ!"
      );
    }

    const classInfo = await classModel.findById(classId);
    if (!classInfo || classInfo.isDeleted) {
      return sendLiveError(
        res,
        404,
        LIVE_ERROR_CODES.CLASS_NOT_FOUND,
        "Lớp học không tồn tại hoặc đã bị xóa!"
      );
    }

    const userId = req.user?.id || req.user?._id;

    // 2. Kiểm tra Teacher Owner: teacherId của lớp phải trùng với ID Giáo viên đăng nhập
    if (userRole === "teacher" && classInfo.teacherId && classInfo.teacherId.toString() === userId?.toString()) {
      req.classInfo = classInfo;
      return next();
    }

    return sendLiveError(
      res,
      403,
      LIVE_ERROR_CODES.TEACHER_NOT_OWNER,
      "Bạn không có quyền quản lý buổi học trực tuyến của lớp học này!"
    );
  } catch (error) {
    console.error("[LiveAuthMW] checkClassTeacherOwnership Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền sở hữu lớp học" });
  }
};

/**
 * Middleware kiểm tra quyền Tham Gia / Xem Lớp Học dành cho Học sinh và Giáo viên chủ trì
 * QUYẾT ĐỊNH CHÍNH THỨC: Admin KHÔNG ĐƯỢC PHÉP xem/truy cập phòng học online.
 */
export const checkClassEnrollment = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();

    // 1. Quản trị viên (Admin) bị CHẶN HOÀN TOÀN khỏi Session Plane
    if (userRole === "admin") {
      return sendLiveError(
        res,
        403,
        LIVE_ERROR_CODES.ADMIN_OPERATION_NOT_ALLOWED,
        "Quản trị viên không được phép vận hành buổi học trực tuyến."
      );
    }

    let classId = req.params.classId || req.body.classId;
    const { sessionId } = req.params;

    if (!classId && sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return sendLiveError(
          res,
          400,
          LIVE_ERROR_CODES.INVALID_SESSION_ID,
          "sessionId không hợp lệ!"
        );
      }
      const session = await LiveSession.findById(sessionId).select("classId status isDeleted roomName");
      if (!session || session.isDeleted) {
        return sendLiveError(
          res,
          404,
          LIVE_ERROR_CODES.SESSION_NOT_FOUND,
          "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!"
        );
      }
      classId = session.classId?.toString();
      req.liveSession = session;
    }

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendLiveError(
        res,
        400,
        LIVE_ERROR_CODES.INVALID_CLASS_ID,
        "ID lớp học không hợp lệ!"
      );
    }

    const classInfo = await classModel.findById(classId);
    if (!classInfo || classInfo.isDeleted) {
      return sendLiveError(
        res,
        404,
        LIVE_ERROR_CODES.CLASS_NOT_FOUND,
        "Lớp học không tồn tại hoặc đã bị xóa!"
      );
    }

    const userId = req.user?.id || req.user?._id;

    // 2. Giáo viên chủ trì lớp được phép xem/truy cập
    if (userRole === "teacher" && classInfo.teacherId && classInfo.teacherId.toString() === userId?.toString()) {
      req.classInfo = classInfo;
      req.isClassOwner = true;
      return next();
    }

    // 3. Học sinh phải nằm trong danh sách students với status "Enrolled"
    if (Array.isArray(classInfo.students)) {
      const isEnrolled = classInfo.students.some(
        (s) => s.studentId && s.studentId.toString() === userId?.toString() && s.status === "Enrolled"
      );
      if (isEnrolled) {
        req.classInfo = classInfo;
        req.isClassOwner = false;
        return next();
      }
    }

    return sendLiveError(
      res,
      403,
      LIVE_ERROR_CODES.STUDENT_NOT_ENROLLED,
      "Bạn chưa đăng ký tham gia hoặc không có quyền truy cập lớp học này!"
    );
  } catch (error) {
    console.error("[LiveAuthMW] checkClassEnrollment Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra danh sách đăng ký lớp học" });
  }
};
