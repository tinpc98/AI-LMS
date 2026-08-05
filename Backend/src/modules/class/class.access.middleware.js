import ClassModel from "./class.model.js";
import AssignmentModel from "../assignment/assignment.model.js";

/**
 * Middleware kiểm tra quyền truy cập vào một lớp học.
 * Hỗ trợ lấy classId từ:
 * - req.params.classId
 * - req.body.classId
 * - tra cứu từ bài tập nếu có req.params.id hoặc req.params.assignmentId
 */
export const checkClassAccess = async (req, res, next) => {
  try {
    let classId = req.params?.classId || req.body?.classId;
    let assignmentId = req.params?.id || req.params?.assignmentId;

    if (!classId && assignmentId) {
      // Truy vấn để lấy classId từ Assignment
      const assignment = await AssignmentModel.findById(assignmentId).select("classId").lean();
      if (!assignment) {
        return res.status(404).json({ message: "Không tìm thấy bài tập" });
      }
      classId = assignment.classId;
      // Gắn assignment vào req để tránh truy vấn lại ở controller/service nếu cần
      req.assignment = assignment;
    }

    if (!classId) {
      return res.status(400).json({ message: "Thiếu thông tin classId hoặc assignmentId" });
    }

    const targetClass = await ClassModel.findById(classId).select("teacherId students").lean();
    if (!targetClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    // Admin có toàn quyền
    if (role === "admin") {
      req.classDetail = targetClass;
      return next();
    }

    // Teacher phải là người tạo / phụ trách lớp
    if (role === "teacher") {
      if (targetClass.teacherId?.toString() !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập lớp học này" });
      }
      req.classDetail = targetClass;
      return next();
    }

    // Student phải thuộc lớp và có status Enrolled
    if (role === "student") {
      const isEnrolled = targetClass.students?.some(
        (s) => s.studentId?.toString() === userId && s.status === "Enrolled"
      );
      if (!isEnrolled) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập lớp học này" });
      }
      req.classDetail = targetClass;
      return next();
    }

    return res.status(403).json({ message: "Bạn không có quyền truy cập lớp học này" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi kiểm tra quyền truy cập lớp" });
  }
};
