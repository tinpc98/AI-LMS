// File: src/middlewares/submissionAccess.middleware.js
// Kiểm tra quyền xem chi tiết một bài nộp (Student / Teacher / Admin).
//
// Tách từ shared/middlewares/ownership.middleware.js ở Wave 3.2. Đây là logic của module
// submission, KHÔNG phải hạ tầng dùng chung — nó đọc model Submission. Vì module submission
// chưa tới lượt migrate, file tạm nằm ở src/middlewares/ cùng các middleware nghiệp vụ khác
// đang chờ (aiQuota, examSetAccess, liveAuth...).
//
// Khi migrate module submission: chuyển file này vào modules/submission/ và export qua
// index.js của module đó.
//
// Đặt ở đây thay vì giữ lại shared/ là có chủ ý: nếu để shared/, việc nó import
// #modules/class sẽ tạo vi phạm no-shared-to-modules.
import SubmissionModel from "../models/submission.model.js";
import { checkClassTeacherOwnership } from "#modules/class";

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
