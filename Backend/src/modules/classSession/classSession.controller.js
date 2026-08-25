import classSessionService from "./classSession.service.js";
import { checkClassTeacherOwnership } from "#modules/class/index.js";
import { ClassEnrollment } from "#modules/classEnrollment/index.js";
import ClassSession from "./classSession.model.js";

const verifyClassAccess = async (classId, req) => {
  const userId = req.user?.id || req.user?._id;
  const role = (req.user?.role || "").toLowerCase();
  
  if (role === "admin") return true;
  if (role === "teacher") {
    return await checkClassTeacherOwnership(classId, userId, role);
  }
  if (role === "student") {
    const enrollment = await ClassEnrollment.findOne({ classId, studentId: userId, status: "ACTIVE" }).lean();
    return !!enrollment;
  }
  return false;
};

export const generateClassSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    const role = (req.user?.role || "").toLowerCase();
    
    if (role === "student") {
      return res.status(403).json({ success: false, message: "Học sinh không có quyền tạo buổi học" });
    }

    const isAuthorized = await verifyClassAccess(classId, req);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền quản lý buổi học của lớp này" });
    }

    const result = await classSessionService.generateSessions(classId);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[ClassSessionController] generateClassSessions Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getClassSessions = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const isAuthorized = await verifyClassAccess(classId, req);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem buổi học của lớp này" });
    }

    const options = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    };

    const data = await classSessionService.getClassSessions(classId, options);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[ClassSessionController] getClassSessions Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ClassSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy buổi học" });
    }

    const isAuthorized = await verifyClassAccess(session.classId, req);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem buổi học này" });
    }

    const data = await classSessionService.getSessionDetail(sessionId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[ClassSessionController] getSessionDetail Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
