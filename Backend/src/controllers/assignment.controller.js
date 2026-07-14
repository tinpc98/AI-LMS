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
      },
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
      const { title, description, deadline, classId, lessonId } = req.body;
      const teacherId = req.user.id;

      if (!title || !deadline || !classId) {
        return res
          .status(400)
          .json({ message: "Thiếu thông tin: Tiêu đề, Hạn nộp hoặc ClassId" });
      }

      let attachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname),
        );
        attachments = await Promise.all(uploadPromises);
      }

      const newAssignment = new Assignment({
        title,
        description,
        attachments,
        deadline,
        classId,
        lessonId,
        teacherId,
      });

      await newAssignment.save();
      return res
        .status(201)
        .json({ message: "Tạo bài tập thành công", assignment: newAssignment });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi tạo bài tập", error: error.message });
    }
  },

  // 2. Giáo viên chấm điểm và nhận xét
  gradeSubmission: async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;

      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài nộp này" });
      }

      submission.grade = grade;
      submission.feedback = feedback;
      submission.status = "graded"; // Chuyển trạng thái sang "Đã chấm"

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

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 3. Lấy danh sách bài tập của lớp (Cả GV và HS đều xem được)
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

  // 4. Lấy danh sách bài nộp của một assignment (dùng cho giáo viên chấm điểm)
  getSubmissionsByAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const submissions = await Submission.find({ assignmentId })
        .populate("studentId", "fullName email")
        .sort({ createdAt: -1 });

      return res.status(200).json({ submissions });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi lấy danh sách bài nộp", error: error.message });
    }
  },

  // 5. Học sinh Nộp bài (Tự động tính trễ hạn & Xử lý nộp lại bài)
  submitAssignment: async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user.id;

      // Kiểm tra bài tập có tồn tại không
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Bài tập không tồn tại" });
      }

      // Thực chiến: So sánh thời gian hiện tại với Deadline để set trạng thái
      const now = new Date();
      const isLate = now > new Date(assignment.deadline);
      const status = isLate ? "late" : "submitted";

      // Xử lý up file bài làm lên Cloudinary (nếu có)
      let newAttachments = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname),
        );
        newAttachments = await Promise.all(uploadPromises);
      }

      // Kiểm tra xem học sinh này đã từng nộp bài cho Assignment này chưa
      let submission = await Submission.findOne({ assignmentId, studentId });

      if (submission) {
        // Kịch bản: Học sinh nộp lại bài
        // Nếu có up file mới, phải dọn rác file cũ trên Cloudinary đi
        if (newAttachments.length > 0 && submission.attachments.length > 0) {
          const deletePromises = submission.attachments.map((file) =>
            cloudinary.uploader.destroy(file.publicId),
          );
          await Promise.all(deletePromises);
        }

        // Cập nhật dữ liệu mới
        if (content) submission.content = content;
        if (newAttachments.length > 0) submission.attachments = newAttachments;
        submission.status = status; // Nếu nộp lại mà qua hạn thì bị dính mác 'late'

        await submission.save();
        return res
          .status(200)
          .json({
            message: "Cập nhật bài nộp (Nộp lại) thành công",
            submission,
          });
      }

      // Kịch bản: Học sinh nộp bài lần đầu tiên
      submission = new Submission({
        assignmentId,
        studentId,
        classId: assignment.classId,
        content,
        attachments: newAttachments,
        status,
      });

      await submission.save();
      return res
        .status(201)
        .json({ message: "Nộp bài thành công", submission });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server khi nộp bài", error: error.message });
    }
  },
};

export default assignmentController;
