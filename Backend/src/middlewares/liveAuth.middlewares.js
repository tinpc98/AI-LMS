import mongoose from "mongoose";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";

/**
 * Middleware kiểm tra quyền Quyền sở hữu Lớp học dành cho Giáo viên (Teacher Owner Check)
 * Áp dụng cho các route: Tạo LiveSession, Kết thúc LiveSession, Cấp Token Moderator.
 */
export const checkClassTeacherOwnership = async (req, res, next) => {
  try {
    let classId = req.params.classId || req.body.classId;
    const { sessionId } = req.params;

    if (!classId && sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: "sessionId không hợp lệ!" });
      }
      const session = await LiveSession.findById(sessionId).select("classId status isDeleted");
      if (!session || session.isDeleted) {
        return res.status(404).json({ success: false, message: "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!" });
      }
      classId = session.classId?.toString();
      req.liveSession = session;
    }

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
    }

    const classInfo = await classModel.findById(classId);
    if (!classInfo || classInfo.isDeleted) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại hoặc đã bị xóa!" });
    }

    const userRole = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id || req.user?._id;

    // Admin có quyền bypass theo quy tắc quản trị
    if (userRole === "admin") {
      req.classInfo = classInfo;
      return next();
    }

    // Kiểm tra Teacher Owner: teacherId của lớp phải trùng với ID người dùng đăng nhập
    if (userRole === "teacher" && classInfo.teacherId && classInfo.teacherId.toString() === userId?.toString()) {
      req.classInfo = classInfo;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền quản lý buổi học trực tuyến của lớp học này!",
    });
  } catch (error) {
    console.error("[LiveAuthMW] checkClassTeacherOwnership Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra quyền sở hữu lớp học" });
  }
};

/**
 * Middleware kiểm tra quyền Tham Gia / Xem Lớp Học dành cho Học sinh (Student Enrollment Check)
 * Áp dụng cho các route: Xem Active Session, Lấy Token Participant.
 */
export const checkClassEnrollment = async (req, res, next) => {
  try {
    let classId = req.params.classId || req.body.classId;
    const { sessionId } = req.params;

    if (!classId && sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: "sessionId không hợp lệ!" });
      }
      const session = await LiveSession.findById(sessionId).select("classId status isDeleted roomName");
      if (!session || session.isDeleted) {
        return res.status(404).json({ success: false, message: "Buổi học trực tuyến không tồn tại hoặc đã bị xóa!" });
      }
      classId = session.classId?.toString();
      req.liveSession = session;
    }

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
    }

    const classInfo = await classModel.findById(classId);
    if (!classInfo || classInfo.isDeleted) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại hoặc đã bị xóa!" });
    }

    const userRole = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id || req.user?._id;

    // Admin và Giáo viên chủ trì lớp được phép xem/truy cập
    if (userRole === "admin" || (userRole === "teacher" && classInfo.teacherId && classInfo.teacherId.toString() === userId?.toString())) {
      req.classInfo = classInfo;
      req.isClassOwner = true;
      return next();
    }

    // Học sinh phải có trong danh sách students với status "Enrolled"
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

    return res.status(403).json({
      success: false,
      message: "Bạn chưa đăng ký tham gia hoặc không có quyền truy cập lớp học này!",
    });
  } catch (error) {
    console.error("[LiveAuthMW] checkClassEnrollment Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi kiểm tra danh sách đăng ký lớp học" });
  }
};
