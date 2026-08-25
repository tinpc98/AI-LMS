import { asyncHandler } from "#shared/utils/asyncHandler.js";
import Exam from "./exam.model.js";
import * as examService from "./exam.service.js";
import { checkClassTeacherOwnership } from "#modules/class";
import { ClassEnrollment } from "#modules/classEnrollment";

/**
 * Kiểm tra quyền giáo viên sở hữu exam (qua classId).
 */
const checkExamOwnership = async (exam, userId, role) => {
  if (!exam) return false;
  if ((role || "").toLowerCase() === "admin") return true;
  return checkClassTeacherOwnership(exam.classId, userId, role);
};

/**
 * POST /api/exams
 * Teacher tạo Exam mới gắn với classId.
 */
export const createExam = asyncHandler(async (req, res) => {
  const { classId, title, duration, attemptsAllowed } = req.body;
  const userId = req.user.id || req.user._id;

  if (!classId || !title || !duration || !attemptsAllowed) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc: classId, title, duration, attemptsAllowed" });
  }

  // Chỉ teacher sở hữu class mới được tạo exam
  const isAuthorized = await checkClassTeacherOwnership(classId, userId, req.user?.role);
  if (!isAuthorized) return res.status(403).json({ success: false, message: "Không có quyền tạo bài thi cho lớp này" });

  const exam = await examService.createExamService(req.body, userId);
  return res.status(201).json({ success: true, message: "Tạo bài thi thành công", data: exam });
});

/**
 * GET /api/exams/class/:classId
 * Lấy danh sách exam theo lớp.
 * Teacher: chỉ lấy exam của class mình.
 * Student: chỉ lấy exam của class mình đang enrolled (PUBLISHED).
 */
export const getExamsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id || req.user._id;
  const role = (req.user?.role || "").toLowerCase();

  let filter = { classId, isDeleted: { $ne: true } };

  if (role === "teacher") {
    const isOwner = await checkClassTeacherOwnership(classId, userId, role);
    if (!isOwner) return res.status(403).json({ success: false, message: "Không có quyền truy cập lớp này" });
    // Teacher xem tất cả status
  } else if (role === "student") {
    // Kiểm tra enrollment
    const enrollment = await ClassEnrollment.findOne({ studentId: userId, classId, status: "ACTIVE" });
    if (!enrollment) return res.status(403).json({ success: false, message: "Bạn không đăng ký vào lớp này" });
    // Student chỉ thấy PUBLISHED
    filter.status = "PUBLISHED";
  }
  // admin: không filter thêm

  const exams = await Exam.find(filter)
    .select("-questions -instructions")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ success: true, data: exams });
});

/**
 * GET /api/exams/:id
 */
export const getExamById = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const role = (req.user.role || "").toLowerCase();

  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

  if (role === "student") {
    if (exam.status !== "PUBLISHED") {
      return res.status(403).json({ success: false, message: "Bài thi chưa được xuất bản" });
    }
    const isEnrolled = await ClassEnrollment.exists({
      studentId: userId,
      classId: exam.classId,
      status: "ACTIVE",
    });
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: "Bạn không được phép truy cập bài thi này" });
    }
  } else if (role === "teacher") {
    const isOwner = await checkExamOwnership(exam, userId, req.user?.role);
    if (!isOwner) return res.status(403).json({ success: false, message: "Không có quyền truy cập bài thi này" });
  }

  return res.status(200).json({ success: true, data: exam });
});

/**
 * PUT /api/exams/:id
 */
export const updateExam = asyncHandler(async (req, res) => {
  const examId = req.params.id;
  const userId = req.user.id || req.user._id;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

  const isAuthorized = await checkExamOwnership(exam, userId, req.user?.role);
  if (!isAuthorized) return res.status(403).json({ success: false, message: "Không có quyền" });

  const updatedExam = await examService.updateExamService(examId, req.body);
  return res.status(200).json({ success: true, message: "Cập nhật thành công", data: updatedExam });
});

/**
 * DELETE /api/exams/:id
 */
export const deleteExam = asyncHandler(async (req, res) => {
  const examId = req.params.id;
  const userId = req.user.id || req.user._id;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

  const isAuthorized = await checkExamOwnership(exam, userId, req.user?.role);
  if (!isAuthorized) return res.status(403).json({ success: false, message: "Không có quyền" });

  await Exam.softDelete(examId, userId);
  return res.status(200).json({ success: true, message: "Đã xóa bài thi" });
});
