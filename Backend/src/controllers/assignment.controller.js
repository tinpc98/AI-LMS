import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import cloudinary from "../config/cloudinary.js";

// Helper function: Đẩy file lên thư mục riêng của Assignments
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "AI_LMS_Assignments",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          name: originalName,
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

const assignmentController = {
  // ==========================================
  // NHÁNH 1: DÀNH CHO GIÁO VIÊN
  // ==========================================

  // 1. Tạo bài tập mới
  createAssignment: async (req, res) => {
    try {
      const { title, description, deadline, classId, lessonId, isAIGenerated, aiPromptUsed } = req.body;
      const teacherId = req.user.id;

      if (!title || !deadline || !classId) {
        return res
          .status(400)
          .json({ message: "Thiếu thông tin: Tiêu đề, Hạn nộp hoặc ClassId" });
      }

      let attachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        attachments = await Promise.all(uploadPromises);
      }

      const newAssignment = new Assignment({
        title,
        description,
        attachments,
        deadline,
        classId,
        lessonId: lessonId || null,
        teacherId,
        createdBy: teacherId,
        isAIGenerated: isAIGenerated === "true" || isAIGenerated === true,
        aiPromptUsed: aiPromptUsed || null,
      });

      await newAssignment.save();
      return res
        .status(201)
        .json({ message: "Tạo bài tập thành công", assignment: newAssignment });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi tạo bài tập" });
    }
  },

  // 2. Giáo viên chấm điểm và nhận xét (Hỗ trợ aiFeedback, gradedBy, gradedAt)
  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback, aiFeedback } = req.body;

      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài nộp này" });
      }

      submission.grade = grade;
      submission.feedback = feedback || "";
      if (aiFeedback !== undefined) submission.aiFeedback = aiFeedback;
      submission.gradedBy = req.user.id;
      submission.gradedAt = new Date();
      submission.status = "graded";

      await submission.save();
      return res
        .status(200)
        .json({ message: "Chấm điểm thành công", submission });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi chấm điểm", error: error.message });
    }
  },

  // 3. Cập nhật bài tập
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, deadline, lessonId } = req.body;

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      if (req.user.role !== "Admin" && assignment.teacherId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền sửa bài tập này" });
      }

      let newAttachments = assignment.attachments || [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        const uploadedFiles = await Promise.all(uploadPromises);
        newAttachments = [...newAttachments, ...uploadedFiles];
      }

      if (title) assignment.title = title;
      if (description !== undefined) assignment.description = description;
      if (deadline) assignment.deadline = deadline;
      if (lessonId !== undefined) assignment.lessonId = lessonId;
      assignment.attachments = newAttachments;

      await assignment.save();
      return res.status(200).json({ message: "Cập nhật bài tập thành công", assignment });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi server khi cập nhật bài tập", error: error.message });
    }
  },

  // 4. Xóa bài tập
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      if (req.user.role !== "Admin" && assignment.teacherId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền xóa bài tập này" });
      }

      await Assignment.findByIdAndDelete(id);
      return res.status(200).json({ message: "Xóa bài tập thành công" });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi server khi xóa bài tập", error: error.message });
    }
  },

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 5. Lấy chi tiết 1 bài tập
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const assignment = await Assignment.findById(id)
        .populate("teacherId", "fullName email avatar")
        .populate("classId", "className classCode");

      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      return res.status(200).json({ assignment });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi server khi lấy chi tiết bài tập", error: error.message });
    }
  },

  // 6. Lấy danh sách bài tập của lớp
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const assignments = await Assignment.find({ classId }).sort({
        createdAt: -1,
      });
      return res.status(200).json({ assignments });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi lấy bài tập", error: error.message });
    }
  },

  // 7. Lấy danh sách bài nộp của một assignment
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const submissions = await Submission.find({ assignmentId })
        .populate("studentId", "fullName email avatar")
        .populate("gradedBy", "fullName email")
        .sort({ createdAt: -1 });

      return res.status(200).json({ submissions });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi lấy danh sách bài nộp", error: error.message });
    }
  },

  // 8. Học sinh Nộp bài (Tự động tính trễ hạn & Xử lý nộp lại bài)
  submitAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user.id;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      const now = new Date();
      const isLate = now > new Date(assignment.deadline);
      const status = isLate ? "late" : "submitted";

      let newAttachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        newAttachments = await Promise.all(uploadPromises);
      }

      let submission = await Submission.findOne({ assignmentId, studentId });

      if (submission) {
        if (newAttachments.length > 0 && submission.attachments.length > 0) {
          const deletePromises = submission.attachments.map((file) =>
            cloudinary.uploader.destroy(file.publicId)
          );
          await Promise.all(deletePromises);
        }

        if (content) submission.content = content;
        if (newAttachments.length > 0) submission.attachments = newAttachments;
        submission.status = status;

        await submission.save();
        return res.status(200).json({
          message: "Cập nhật bài nộp (Nộp lại) thành công",
          submission,
        });
      }

      submission = new Submission({
        assignmentId,
        studentId,
        classId: assignment.classId,
        content,
        attachments: newAttachments,
        status,
      });

      await submission.save();
      return res.status(201).json({ message: "Nộp bài thành công", submission });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi nộp bài", error: error.message });
    }
  },

  // 9. Học sinh Hủy nộp bài
  cancelSubmission: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.id;

      const submission = await Submission.findOne({ assignmentId, studentId });
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài nộp để hủy" });
      }

      if (submission.attachments && submission.attachments.length > 0) {
        const deletePromises = submission.attachments
          .filter((file) => file.publicId)
          .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
        await Promise.all(deletePromises);
      }

      await Submission.deleteOne({ _id: submission._id });

      return res.status(200).json({ message: "Đã hủy nộp bài thành công" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi hủy nộp bài", error: error.message });
    }
  },
};

export default assignmentController;
