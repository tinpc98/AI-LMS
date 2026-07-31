import * as assignmentService from "./assignment.service.js";

const assignmentController = {
  // ==========================================
  // NHÁNH 1: DÀNH CHO GIÁO VIÊN
  // ==========================================

  // 1. Tạo bài tập mới
  createAssignment: async (req, res) => {
    try {
      const { title, description, deadline, classId, lessonId, isAIGenerated, aiPromptUsed } =
        req.body;
      const teacherId = req.user.id || req.user._id;

      const newAssignment = await assignmentService.createAssignmentService({
        title,
        description,
        deadline,
        classId,
        lessonId,
        isAIGenerated,
        aiPromptUsed,
        files: req.files,
        teacherId,
        teacherRole: req.user?.role,
      });

      return res.status(201).json({
        message: "Tạo bài tập thành công",
        assignment: newAssignment,
        data: newAssignment,
      });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi tạo bài tập" });
    }
  },

  // 2. Giáo viên chấm điểm và nhận xét
  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback, aiFeedback } = req.body;
      const userId = req.user.id || req.user._id;

      const submission = await assignmentService.gradeSubmissionService({
        submissionId,
        grade,
        feedback,
        aiFeedback,
        userId,
        userRole: req.user?.role,
      });

      return res
        .status(200)
        .json({ message: "Chấm điểm thành công", submission, data: submission });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi chấm điểm" });
    }
  },

  // 3. Cập nhật bài tập
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, deadline, lessonId } = req.body;
      const userId = req.user.id || req.user._id;

      const assignment = await assignmentService.updateAssignmentService({
        id,
        title,
        description,
        deadline,
        lessonId,
        files: req.files,
        userId,
        userRole: req.user?.role,
      });

      return res
        .status(200)
        .json({ message: "Cập nhật bài tập thành công", assignment, data: assignment });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi cập nhật bài tập" });
    }
  },

  // 4. Xóa bài tập
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id || req.user._id;

      await assignmentService.deleteAssignmentService({ id, userId, userRole: req.user?.role });
      return res.status(200).json({ message: "Xóa bài tập thành công" });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi xóa bài tập" });
    }
  },

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 5. Lấy chi tiết 1 bài tập
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.getAssignmentByIdService(id);
      return res.status(200).json({ assignment, data: assignment });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi lấy chi tiết bài tập" });
    }
  },

  // 6. Lấy danh sách bài tập của lớp
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { page, limit } = req.query;

      const { assignments, pagination } = await assignmentService.getAssignmentsByClassService({
        classId,
        page,
        limit,
      });

      const responseBody = { assignments, data: assignments }; // Backward compatible
      if (pagination) responseBody.pagination = pagination;
      return res.status(200).json(responseBody);
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi lấy bài tập" });
    }
  },

  // 7. Lấy danh sách bài nộp của một assignment (Chỉ Giáo viên phân công / Admin)
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { page, limit } = req.query;
      const userId = req.user.id || req.user._id;

      const { submissions, pagination } = await assignmentService.getSubmissionsByAssignmentService(
        {
          assignmentId,
          page,
          limit,
          userId,
          userRole: req.user?.role,
        }
      );

      const responseBody = { submissions, data: submissions };
      if (pagination) responseBody.pagination = pagination;
      return res.status(200).json(responseBody);
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi lấy danh sách bài nộp" });
    }
  },

  // 8. Lấy chi tiết 1 bài nộp (Đã được xác thực quyền qua canViewSubmission middleware)
  getSubmissionById: async (req, res) => {
    try {
      // req.submission đã được gán bởi middleware canViewSubmission
      return res
        .status(200)
        .json({ success: true, submission: req.submission, data: req.submission });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Lỗi server khi lấy bài nộp" });
    }
  },

  // 9. Lấy bài nộp cá nhân của Học sinh
  getMySubmission: async (req, res) => {
    try {
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
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi lấy bài nộp cá nhân" });
    }
  },

  // 9. Học sinh Nộp bài / Nộp lại bài
  submitAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user.id || req.user._id;

      const { submission, isNew } = await assignmentService.submitAssignmentService({
        assignmentId,
        content,
        files: req.files,
        studentId,
      });

      if (isNew) {
        return res
          .status(201)
          .json({ message: "Nộp bài tập thành công", submission, data: submission });
      }
      return res
        .status(200)
        .json({ message: "Nộp lại bài tập thành công", submission, data: submission });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi nộp bài" });
    }
  },

  // 10. Học sinh Hủy nộp bài
  cancelSubmission: async (req, res) => {
    try {
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
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Lỗi server khi hủy nộp bài" });
    }
  },
};

export default assignmentController;
