// File: src/shared/middlewares/ownership.middleware.js
// Kiểm tra quyền sở hữu ở mức nghiệp vụ: giáo viên có phụ trách lớp này không, người dùng
// có được xem bài nộp này không.
//
// TẠM THỜI đặt ở shared/ theo đúng §2.1 của kế hoạch. Nhưng đây KHÔNG phải hạ tầng dùng
// chung thật sự — nó đọc model Class và Submission, tức là logic của module class và
// submission. Khi hai module đó được migrate (Wave 3.2), chuyển:
//     checkClassTeacherOwnership -> modules/class/
//     canViewSubmission          -> modules/submission/
// Giữ ở đây lúc này vì Class/Submission model vẫn còn ở src/models/, nên chưa phát sinh
// vi phạm no-shared-to-modules.
//
// Tách từ auth.middleware.js ở Wave 3.2.
import ClassModel from "../../models/class.model.js";
import SubmissionModel from "../../models/submission.model.js";

// Helper kiểm tra quyền sở hữu lớp học của Giáo viên (hoặc Admin)
export const checkClassTeacherOwnership = async (classId, userId, userRole) => {
  if (!classId) return false;
  const role = (userRole || "").toLowerCase();
  if (role === "admin") return true;
  if (role !== "teacher") return false;

  const targetClass = await ClassModel.findById(classId);
  if (!targetClass) return false;

  return targetClass.teacherId?.toString() === userId?.toString();
};

// Middleware kiểm tra quyền xem chi tiết 1 bài nộp (Student, Teacher, Admin)
export const canViewSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    if (!submissionId) return res.status(400).json({ message: "INVALID_ID" });

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
    return res
      .status(500)
      .json({ message: error.message || "Lỗi kiểm tra quyền truy cập bài nộp" });
  }
};
