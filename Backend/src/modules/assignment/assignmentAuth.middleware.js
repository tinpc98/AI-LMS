import Assignment from "./assignment.model.js";
import Topic from "../topic/topic.model.js";
import Class from "../class/class.model.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";

// Lỗi chung cho Assignment
const ASSIGNMENT_ERROR_CODES = {
  ASSIGNMENT_NOT_FOUND: "ASSIGNMENT_NOT_FOUND",
  STUDENT_NOT_ENROLLED: "STUDENT_NOT_ENROLLED",
  TEACHER_NOT_AUTHORIZED: "TEACHER_NOT_AUTHORIZED",
};

/**
 * Middleware: checkAssignmentAccess
 * Kiểm tra xem Student có thuộc một trong các lớp thuộc Course chứa Assignment này không.
 * Đồng thời phân giải `req.assignmentInfo` để sử dụng ở Controller.
 */
export const checkAssignmentAccess = async (req, res, next) => {
  try {
    const assignmentId = req.params.id || req.body.assignmentId;
    if (!assignmentId) {
      return res.status(400).json({ message: "Thiếu assignmentId" });
    }

    const assignment = await Assignment.findById(assignmentId).populate("topicId");
    if (!assignment || !assignment.topicId) {
      return res.status(404).json({ message: "Assignment không tồn tại hoặc lỗi dữ liệu" });
    }

    req.assignmentInfo = assignment;

    const userRole = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id || req.user?._id;

    // Admin được phép
    if (userRole === "admin") {
      req.isAssignmentOwner = true;
      return next();
    }

    const courseId = assignment.topicId.courseId;

    // Nếu là giáo viên, kiểm tra xem họ có phải người tạo course không
    if (userRole === "teacher") {
      const topic = await Topic.findById(assignment.topicId).populate("courseId");
      if (topic && topic.courseId && topic.courseId.createdBy.toString() === userId.toString()) {
        req.isAssignmentOwner = true;
        return next();
      }
      return res.status(403).json({
        code: ASSIGNMENT_ERROR_CODES.TEACHER_NOT_AUTHORIZED,
        message: "Bạn không có quyền quản lý Assignment này",
      });
    }

    // Nếu là học sinh, kiểm tra ClassEnrollment
    if (userRole === "student") {
      // 1. Tìm tất cả các lớp thuộc Course
      const classes = await Class.find({ courseId, isDeleted: { $ne: true } }).select("_id");
      const classIds = classes.map((c) => c._id);

      if (classIds.length === 0) {
        return res.status(403).json({
          code: ASSIGNMENT_ERROR_CODES.STUDENT_NOT_ENROLLED,
          message: "Course này chưa có lớp học nào",
        });
      }

      // 2. Kiểm tra xem học sinh có đang ACTIVE ở ít nhất 1 lớp không
      const isEnrolled = await ClassEnrollment.exists({
        studentId: userId,
        classId: { $in: classIds },
        status: "ACTIVE",
      });

      if (isEnrolled) {
        req.isAssignmentOwner = false;
        return next();
      }
    }

    return res.status(403).json({
      code: ASSIGNMENT_ERROR_CODES.STUDENT_NOT_ENROLLED,
      message: "Bạn chưa đăng ký tham gia lớp học nào thuộc Course này!",
    });
  } catch (error) {
    console.error("[AssignmentAuthMW] checkAssignmentAccess Error:", error);
    return res.status(500).json({ message: "Lỗi kiểm tra quyền truy cập Assignment" });
  }
};
