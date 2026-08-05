// Controller bài tập
import * as assignmentService from "./assignment.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

const assignmentController = {
  // ==========================================
  // NHÁNH 1: DÀNH CHO GIÁO VIÊN
  // ==========================================

  // 1. Tạo bài tập mới
  createAssignment: asyncHandler(async (req, res) => {
    const {
      title,
      description,
      submissionMode,
      questions,
      deadline,
      classId,
      lessonId,
      isAIGenerated,
      aiPromptUsed,
      maxScore,
    } = req.body || {};
    const teacherId = req.user.id || req.user._id;

    const newAssignment = await assignmentService.createAssignmentService({
      title,
      description,
      submissionMode,
      questions,
      deadline,
      classId,
      lessonId,
      isAIGenerated,
      aiPromptUsed,
      maxScore,
      files: req.files,
      teacherId,
      teacherRole: req.user?.role,
    });

    return res.status(201).json({
      message: "Tạo bài tập thành công",
      assignment: newAssignment,
      data: newAssignment,
    });
  }),

  // 2. Giáo viên chấm điểm và nhận xét
  gradeSubmission: asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { grade, feedback, aiFeedback } = req.body || {};
    const userId = req.user.id || req.user._id;

    const submission = await assignmentService.gradeSubmissionService({
      submissionId,
      grade,
      feedback,
      aiFeedback,
      userId,
      userRole: req.user?.role,
    });

    return res.status(200).json({ message: "Chấm điểm thành công", submission, data: submission });
  }),

  // 3. Cập nhật bài tập
  updateAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, submissionMode, questions, deadline, lessonId, maxScore } = req.body || {};
    const userId = req.user.id || req.user._id;

    const assignment = await assignmentService.updateAssignmentService({
      id,
      title,
      description,
      submissionMode,
      questions,
      deadline,
      lessonId,
      maxScore,
      files: req.files,
      userId,
      userRole: req.user?.role,
    });

    return res
      .status(200)
      .json({ message: "Cập nhật bài tập thành công", assignment, data: assignment });
  }),

  // 4. Xóa bài tập
  deleteAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    await assignmentService.deleteAssignmentService({ id, userId, userRole: req.user?.role });
    return res.status(200).json({ message: "Xóa bài tập thành công" });
  }),

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 5. Lấy chi tiết 1 bài tập
  getAssignmentById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentByIdService(id);
    return res.status(200).json({ assignment, data: assignment });
  }),

  // 6. Lấy danh sách bài tập của lớp
  getAssignmentsByClass: asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { page, limit } = req.query;

    const { assignments, pagination } = await assignmentService.getAssignmentsByClassService({
      classId,
      page,
      limit,
    });

    const responseBody = { assignments, data: assignments };
    if (pagination) responseBody.pagination = pagination;
    return res.status(200).json(responseBody);
  }),

  // 7. Lấy danh sách bài nộp của một assignment (Chỉ Giáo viên phân công / Admin)
  getSubmissionsByAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.id || req.user._id;

    const { submissions, pagination } = await assignmentService.getSubmissionsByAssignmentService({
      assignmentId,
      page,
      limit,
      userId,
      userRole: req.user?.role,
    });

    const responseBody = { submissions, data: submissions };
    if (pagination) responseBody.pagination = pagination;
    return res.status(200).json(responseBody);
  }),

  // 8. Lấy chi tiết 1 bài nộp (Đã được xác thực quyền qua canViewSubmission middleware)
  getSubmissionById: asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json({ success: true, submission: req.submission, data: req.submission });
  }),

  // 9. Lấy bài nộp cá nhân của Học sinh
  getMySubmission: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({ message: "UNAUTHENTICATED" });
    }
    const studentId = req.user.id || req.user._id;

    const submission = await assignmentService.getMySubmissionService({
      assignmentId,
      studentId,
    });
    return res.status(200).json({ success: true, submission, data: submission });
  }),

  // 10. Học sinh lưu bản nháp (Draft)
  saveDraft: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { content, submissionType, linkUrl, answers } = req.body || {};
    const studentId = req.user.id || req.user._id;

    const { submission, savedAt } = await assignmentService.saveDraftService({
      assignmentId,
      content,
      submissionType,
      linkUrl,
      answers,
      studentId,
    });

    return res.status(200).json({
      success: true,
      message: "Lưu bản nháp thành công",
      savedAt,
      submission,
      data: submission,
    });
  }),

  // 11. Học sinh Nộp bài / Nộp lại bài
  submitAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { content, submissionType, linkUrl, answers } = req.body || {};
    const studentId = req.user.id || req.user._id;

    const { submission, isNew } = await assignmentService.submitAssignmentService({
      assignmentId,
      content,
      submissionType,
      linkUrl,
      answers,
      files: req.files,
      studentId,
    });

    return res.status(isNew ? 201 : 200).json({
      message: isNew ? "Nộp bài tập thành công" : "Nộp lại bài tập thành công",
      submission,
      data: submission,
    });
  }),

  // 12. Học sinh Hủy nộp bài
  cancelSubmission: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.user.id || req.user._id;

    const submission = await assignmentService.cancelSubmissionService({
      assignmentId,
      studentId,
    });

    return res.status(200).json({
      success: true,
      message: "Đã hủy bài nộp thành công",
      submission,
      data: submission,
    });
  }),
};

export default assignmentController;
