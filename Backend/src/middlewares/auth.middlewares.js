// File: src/middlewares/auth.middlewares.js
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

// Kiểm tra xem người dùng đã đăng nhập hay chưa
export const verifyUser = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập hệ thống!" });
  }

  try {
    const token = authorization.split(" ")[1]; // Tách chuỗi "Bearer <token>"
    if (!token) {
      return res.status(401).json({ message: "Định dạng token không hợp lệ!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456");

    // Chuẩn hóa đính kèm cả id và _id để tránh mismatch giữa các controllers
    const userId = decoded.id || decoded._id;

    // Kiểm tra trạng thái tài khoản thực tế từ DB (Xử lý Soft Delete và Lock)
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Tài khoản của bạn không tồn tại hoặc đã bị vô hiệu hóa!" });
    }

    if (user.status === "Inactive" || user.status === "Locked") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!" });
    }

    req.user = {
      ...decoded,
      id: userId,
      _id: userId,
      role: user.role, // Lấy role mới nhất từ DB
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// Kiểm tra xem có phải Giáo viên hoặc Admin hay không
export const isTeacher = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!" });
  }
  const userRole = (req.user.role || "").toLowerCase();
  const allowedRoles = ["teacher", "admin"];
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: "Quyền truy cập bị từ chối. Chỉ Giáo viên hoặc Admin mới được phép thực hiện chức năng này",
    });
  }
  next();
};

// Kiểm tra xem có phải Admin hay không
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Bạn chưa đăng nhập hoặc không có thông tin xác thực!" });
  }
  const userRole = (req.user.role || "").toLowerCase();
  if (userRole !== "admin") {
    return res.status(403).json({
      message: "Quyền truy cập bị từ chối. Chỉ Quản trị viên (Admin) mới có quyền quản lý hệ thống",
    });
  }
  next();
};

// Helper kiem tra quyen so huong lop hoc cua Giao vien (hoac Admin)
export const checkClassTeacherOwnership = async (classId, userId, userRole) => {
  if (!classId) return false;
  const role = (userRole || "").toLowerCase();
  if (role === "admin") return true;
  if (role !== "teacher") return false;

  const ClassModel = (await import("../models/class.model.js")).default;
  const targetClass = await ClassModel.findById(classId);
  if (!targetClass) return false;

  return targetClass.teacherId?.toString() === userId?.toString();
};

// Middleware kiểm tra quyền xem chi tiết 1 bài nộp (Student, Teacher, Admin)
export const canViewSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    if (!submissionId) return res.status(400).json({ message: "INVALID_ID" });

    const SubmissionModel = (await import("../models/submission.model.js")).default;
    const submission = await SubmissionModel.findById(submissionId).lean();
    
    if (!submission) {
      return res.status(404).json({ message: "SUBMISSION_NOT_FOUND" });
    }

    const userId = req.user._id.toString();
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole === "admin") {
      req.submission = submission;
      return next();
    }

    if (userRole === "student") {
      if (submission.studentId.toString() !== userId) {
        return res.status(403).json({ message: "SUBMISSION_ACCESS_DENIED" });
      }
      req.submission = submission;
      return next();
    }

    if (userRole === "teacher") {
      const isAuthorized = await checkClassTeacherOwnership(submission.classId, userId, userRole);
      if (!isAuthorized) {
        return res.status(403).json({ message: "SUBMISSION_ACCESS_DENIED" });
      }
      req.submission = submission;
      return next();
    }

    return res.status(403).json({ message: "SUBMISSION_ACCESS_DENIED" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi kiểm tra quyền truy cập bài nộp" });
  }
};
