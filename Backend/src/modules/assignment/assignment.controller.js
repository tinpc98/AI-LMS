import * as assignmentService from "./assignment.service.js";
import * as assignmentRepo from "./assignment.repository.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import Topic from "../topic/topic.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import { BusinessRuleError, AuthorizationError, NotFoundError } from "#shared/utils/appError.js";

// Helper check ownership (from Topic -> Course -> createdBy)
const checkTopicOwnership = async (topicId, userId, role) => {
  if (role === "Admin" || role === "admin" || role === "ADMIN") return true;
  const topic = await Topic.findById(topicId).populate("courseId");
  if (!topic || !topic.courseId) return false;
  return topic.courseId.createdBy.toString() === userId.toString();
};

export const createAssignment = asyncHandler(async (req, res) => {
  const { topicId, title, description, instructions, questions, status } = req.body;
  const userId = req.user.id || req.user._id;

  if (!topicId || !title) return res.status(400).json({ message: "Thiếu topicId hoặc title" });

  const isAuthorized = await checkTopicOwnership(topicId, userId, req.user?.role);
  if (!isAuthorized) return res.status(403).json({ message: "Không có quyền tạo bài tập cho Topic này" });

  const assignment = await assignmentService.createAssignmentService(req.body, userId);
  return res.status(201).json({ message: "Tạo bài tập thành công", assignment });
});

export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignmentRepo.findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const userId = req.user.id || req.user._id;
  const userRole = (req.user?.role || "").toUpperCase();

  if (userRole === "STUDENT") {
    if (assignment.status !== "PUBLISHED") {
      return res.status(403).json({ message: "Forbidden: Assignment not published" });
    }
    const topic = await Topic.findById(assignment.topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const ClassModel = (await import("../class/class.model.js")).default;
    const ClassEnrollmentModel = (await import("../classEnrollment/classEnrollment.model.js")).default;

    const classes = await ClassModel.find({ courseId: topic.courseId, isDeleted: { $ne: true } }).select("_id");
    const classIds = classes.map(c => c._id);

    const isEnrolled = await ClassEnrollmentModel.exists({
      studentId: userId,
      classId: { $in: classIds },
      status: "ACTIVE"
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: "Forbidden: Not enrolled in any class for this assignment" });
    }
    
    // Khuyến nghị: Ẩn answer key hoặc thông tin của giáo viên đối với học sinh.
    // Tạm giữ nguyên response contract để không phá vỡ UI như yêu cầu.
  } else if (userRole === "TEACHER") {
    const isAuthorized = await checkTopicOwnership(assignment.topicId, userId, userRole);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Forbidden: You do not own this assignment" });
    }
  }

  return res.status(200).json({ assignment });
});

export const publishAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentRepo.findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });

  const userId = req.user.id || req.user._id;
  const isAuthorized = await checkTopicOwnership(assignment.topicId, userId, req.user?.role);
  if (!isAuthorized) return res.status(403).json({ message: "Không có quyền sửa bài tập này" });

  if (!assignment.questions || assignment.questions.length === 0) {
    return res.status(400).json({ message: "Phải có ít nhất 1 câu hỏi để publish" });
  }

  // Validate points >= 0
  if (assignment.questions.some(q => q.points < 0)) {
    return res.status(400).json({ message: "Điểm không hợp lệ" });
  }

  assignment.status = "PUBLISHED";
  await assignment.save();
  return res.status(200).json({ message: "Publish thành công", assignment });
});

export const startAttempt = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  
  const attempt = await assignmentService.startAttemptService(req.params.id, studentId);
  return res.status(201).json({ message: "Bắt đầu làm bài", attempt });
});

export const getAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const userId = req.user.id || req.user._id;
  const userRole = (req.user?.role || "").toLowerCase();

  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  if (userRole === "student" && attempt.studentId.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (userRole === "teacher") {
    // Check if teacher owns the assignment
    const assignment = await assignmentRepo.findAssignmentById(attempt.assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    const isAuthorized = await checkTopicOwnership(assignment.topicId, userId, req.user?.role);
    if (!isAuthorized) return res.status(403).json({ message: "Forbidden: Teacher does not own this assignment" });
  }

  return res.status(200).json({ attempt });
});

export const saveAnswer = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const questionId = req.params.questionId;
  const studentId = req.user.id || req.user._id;
  
  const attempt = await assignmentService.saveAnswerService(attemptId, questionId, studentId, req.body);
  return res.status(200).json({ message: "Đã lưu", attempt });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const studentId = req.user.id || req.user._id;
  
  const attempt = await assignmentService.submitAttemptService(attemptId, studentId);
  return res.status(200).json({ message: "Nộp bài thành công", attempt });
});

export const getAttemptHistory = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.user.id || req.user._id;
  const attempts = await assignmentRepo.findAttemptsByStudentAndAssignment(studentId, assignmentId);
  return res.status(200).json({ attempts });
});

export const getAttemptsForTeacher = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;
  // checkAssignmentAccess middleware already verifies the teacher owns the assignment
  const AssignmentAttempt = (await import("./assignmentAttempt.model.js")).default || (await import("mongoose")).model("AssignmentAttempt");
  const attempts = await AssignmentAttempt.find({ assignmentId })
    .populate("studentId", "fullName email")
    .sort({ startedAt: -1 });
    
  return res.status(200).json({ attempts });
});

export const gradeEssay = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const questionId = req.params.questionId;
  const { score, feedback } = req.body;
  const userId = req.user.id || req.user._id;

  const attempt = await assignmentRepo.findAttemptById(attemptId);
  if (!attempt) throw new NotFoundError("Attempt not found");

  const assignment = await assignmentRepo.findAssignmentById(attempt.assignmentId);
  if (!assignment) throw new NotFoundError("Assignment not found");

  const isAuthorized = await checkTopicOwnership(assignment.topicId, userId, req.user?.role);
  if (!isAuthorized) throw new AuthorizationError("Forbidden");

  const updatedAttempt = await assignmentService.gradeEssayService(attemptId, questionId, score, feedback);
  return res.status(200).json({ message: "Chấm điểm thành công", attempt: updatedAttempt });
});
