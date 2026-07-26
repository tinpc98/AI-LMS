import mongoose from "mongoose";
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
      const teacherId = req.user.id || req.user._id;

      if (!title || !deadline || !classId) {
        return res
          .status(400)
          .json({ message: "Thiếu thông tin: Tiêu đề, Hạn nộp hoặc ClassId" });
      }

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
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
        lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : null,
        teacherId,
        createdBy: teacherId,
        isAIGenerated: isAIGenerated === "true" || isAIGenerated === true,
        aiPromptUsed: aiPromptUsed || null,
      });

      await newAssignment.save();
      return res
        .status(201)
        .json({ message: "Tạo bài tập thành công", assignment: newAssignment, data: newAssignment });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi tạo bài tập" });
    }
  },

  // 2. Giáo viên chấm điểm và nhận xét
  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback, aiFeedback } = req.body;

      if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
        return res.status(400).json({ message: "ID bài nộp không hợp lệ!" });
      }

      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài nộp này" });
      }

      submission.grade = grade;
      submission.feedback = feedback || "";
      if (aiFeedback !== undefined) submission.aiFeedback = aiFeedback;
      submission.gradedBy = req.user.id || req.user._id;
      submission.gradedAt = new Date();
      submission.status = "graded";

      await submission.save();
      return res
        .status(200)
        .json({ message: "Chấm điểm thành công", submission, data: submission });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi chấm điểm" });
    }
  },

  // 3. Cập nhật bài tập
  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, deadline, lessonId } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ!" });
      }

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      const userId = (req.user.id || req.user._id).toString();
      const userRole = (req.user.role || "").toLowerCase();

      if (userRole !== "admin" && assignment.teacherId?.toString() !== userId) {
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
      return res.status(200).json({ message: "Cập nhật bài tập thành công", assignment, data: assignment });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Lỗi server khi cập nhật bài tập" });
    }
  },

  // 4. Xóa bài tập
  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ!" });
      }

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      const userId = (req.user.id || req.user._id).toString();
      const userRole = (req.user.role || "").toLowerCase();

      if (userRole !== "admin" && assignment.teacherId?.toString() !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền xóa bài tập này" });
      }

      await Assignment.softDelete(id, userId);
      return res.status(200).json({ message: "Xóa bài tập thành công" });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Lỗi server khi xóa bài tập" });
    }
  },

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 5. Lấy chi tiết 1 bài tập
  getAssignmentById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: "Bài tập không tồn tại!" });
      }

      const assignment = await Assignment.findById(id)
        .populate("teacherId", "fullName email avatar")
        .populate("classId", "className classCode")
        .lean();

      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      return res.status(200).json({ assignment, data: assignment });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Lỗi server khi lấy chi tiết bài tập" });
    }
  },

  // 6. Lấy danh sách bài tập của lớp
  getAssignmentsByClass: async (req, res) => {
    try {
      const { classId } = req.params;
      if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(200).json({ assignments: [], data: [] });
      }

      const assignments = await Assignment.find({ classId })
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json({ assignments, data: assignments });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi lấy bài tập" });
    }
  },

  // 7. Lấy danh sách bài nộp của một assignment
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(200).json({ submissions: [], data: [] });
      }

      const submissions = await Submission.find({ assignmentId })
        .populate("studentId", "fullName email avatar")
        .populate("gradedBy", "fullName email")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ submissions, data: submissions });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi lấy danh sách bài nộp" });
    }
  },

  // 8. Học sinh Nộp bài
  submitAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user.id || req.user._id;

      if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ!" });
      }

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
          const deletePromises = submission.attachments
            .filter((file) => file && file.publicId)
            .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
          await Promise.all(deletePromises);
        }

        if (content) submission.content = content;
        if (newAttachments.length > 0) submission.attachments = newAttachments;
        submission.status = status;

        await submission.save();
        return res.status(200).json({
          message: "Cập nhật bài nộp (Nộp lại) thành công",
          submission,
          data: submission,
        });
      }

      submission = new Submission({
        assignmentId,
        studentId,
        classId: assignment.classId,
        content: content || "",
        attachments: newAttachments,
        status,
      });

      await submission.save();
      return res.status(201).json({ message: "Nộp bài thành công", submission, data: submission });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi nộp bài" });
    }
  },

  // 9. Học sinh Hủy nộp bài
  cancelSubmission: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.id || req.user._id;

      if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ message: "ID bài tập không hợp lệ!" });
      }

      const submission = await Submission.findOne({ assignmentId, studentId });
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài nộp để hủy" });
      }

      if (submission.attachments && submission.attachments.length > 0) {
        const deletePromises = submission.attachments
          .filter((file) => file && file.publicId)
          .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
        await Promise.all(deletePromises);
      }

      await submission.softDelete(studentId);

      return res.status(200).json({ message: "Đã hủy nộp bài thành công" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: error.message || "Lỗi server khi hủy nộp bài" });
    }
  },
};

export default assignmentController;
