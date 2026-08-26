import Lesson from "./lesson.model.js";
import { Topic } from "#modules/topic";
import Class from "../class/class.model.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import {
  createLessonService,
  getLessonByIdService,
  updateLessonService,
  updateLessonStatusService,
  createPracticeQuizService,
  uploadLessonDocumentService,
  deleteLessonService,
  checkTopicTeacherOwnership,
} from "./lesson.service.js";

// Học sinh phải đang tham gia (ClassEnrollment ACTIVE) 1 lớp thuộc Course chứa Topic — kiểm
// tra ở cấp lớp (khác Enrollment cấp khóa học dùng cho lessonProgress.service.js), giữ NGUYÊN
// pattern đã có từ trước khi rework mục 1.
const checkStudentClassAccess = async (topicId, studentId) => {
  const topic = await Topic.findById(topicId);
  if (!topic) return false;

  const classes = await Class.find({ courseId: topic.courseId, isDeleted: { $ne: true } }).select(
    "_id"
  );
  const classIds = classes.map((c) => c._id);

  return ClassEnrollment.exists({ studentId, classId: { $in: classIds }, status: "ACTIVE" });
};

// Loại bỏ options[].isCorrect khỏi mọi câu hỏi Practice Quiz trước khi trả cho học sinh — quiz
// được populate đủ nội dung để hiển thị đề, nhưng đáp án đúng chỉ được lộ SAU khi nộp bài.
const stripQuizAnswers = (lesson) => {
  const plain = lesson.toObject ? lesson.toObject() : lesson;
  for (const block of plain.blocks || []) {
    if (block.type !== "PRACTICE_QUIZ" || !block.quizId?.questions) continue;
    for (const q of block.quizId.questions) {
      if (q.questionId?.options) {
        q.questionId.options = q.questionId.options.map(({ isCorrect, ...rest }) => rest);
      }
    }
  }
  return plain;
};

const lessonController = {
  createLesson: asyncHandler(async (req, res) => {
    let { topicId, classId, title, description, content, blocks, order, status } = req.body;
    const userId = req.user.id || req.user._id;

    if (!topicId && classId) {
      const classObj = await Class.findById(classId);
      if (!classObj) return res.status(404).json({ message: "Không tìm thấy lớp học" });

      let defaultTopic = await Topic.findOne({
        courseId: classObj.courseId,
        name: "Migrated Lessons Topic",
      });
      if (!defaultTopic) {
        defaultTopic = await Topic.create({
          name: "Migrated Lessons Topic",
          courseId: classObj.courseId,
          description: "Default topic for class lessons",
          order: 999,
          createdBy: userId,
        });
      }
      topicId = defaultTopic._id;
    }

    const lesson = await createLessonService(
      { topicId, title, description, content, blocks, order, status },
      userId,
      req.user?.role
    );
    return res.status(201).json({ message: "Tạo bài giảng thành công", lesson });
  }),

  getLessonsByTopic: asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const query = { topicId };

    if (role === "STUDENT") {
      query.status = "PUBLISHED";
      const hasAccess = await checkStudentClassAccess(topicId, userId);
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Bạn chưa tham gia lớp học nào thuộc khóa học này." });
      }
    }

    const lessons = await Lesson.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select("-content")
      .lean();
    return res.status(200).json({ lessons });
  }),

  getLessonsByClass: asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    if (role === "STUDENT") {
      const isEnrolled = await ClassEnrollment.exists({
        studentId: userId,
        classId,
        status: "ACTIVE",
      });
      if (!isEnrolled) return res.status(403).json({ message: "Bạn chưa tham gia lớp học này." });
    }

    const topics = await Topic.find({ courseId: classObj.courseId }).select("_id");
    const topicIds = topics.map((t) => t._id);

    const query = { topicId: { $in: topicIds } };
    if (role === "STUDENT") query.status = "PUBLISHED";

    const lessons = await Lesson.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select("-content")
      .lean();
    return res.status(200).json({ lessons });
  }),

  getLessonById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const lesson = await getLessonByIdService(id, userId, req.user?.role);

    if (role === "STUDENT") {
      if (lesson.status !== "PUBLISHED") {
        return res.status(403).json({ message: "Bài giảng chưa được xuất bản" });
      }
      const hasAccess = await checkStudentClassAccess(lesson.topicId, userId);
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Bạn chưa tham gia lớp học nào thuộc khóa học chứa bài giảng này." });
      }
      // Không được lộ đáp án đúng cho học sinh TRƯỚC khi nộp Practice Quiz — chỉ hiện sau khi
      // chấm (xem lessonProgress.service.js#submitPracticeQuizAttemptService).
      return res.status(200).json({ lesson: stripQuizAnswers(lesson) });
    }

    const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, req.user?.role);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập bài giảng này!" });
    }

    return res.status(200).json({ lesson });
  }),

  updateLesson: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, content, blocks, order } = req.body;
    const userId = req.user.id || req.user._id;

    const lesson = await updateLessonService(
      id,
      { title, description, content, blocks, order },
      userId,
      req.user?.role
    );
    return res.status(200).json({ message: "Cập nhật bài giảng thành công", lesson });
  }),

  updateLessonStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;

    const lesson = await updateLessonStatusService(id, status, userId, req.user?.role);
    return res.status(200).json({ message: "Cập nhật trạng thái thành công", lesson });
  }),

  uploadDocument: asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const result = await uploadLessonDocumentService(req.file, userId);
    return res.status(201).json({ message: "Tải lên tài liệu thành công", document: result });
  }),

  createPracticeQuiz: asyncHandler(async (req, res) => {
    const { title, questions } = req.body;
    const userId = req.user.id || req.user._id;

    const quiz = await createPracticeQuizService({ title, questions }, userId);
    return res.status(201).json({ message: "Tạo Practice Quiz thành công", quiz });
  }),

  deleteLesson: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    await deleteLessonService(id, userId, req.user?.role);
    return res.status(200).json({ message: "Đã xóa bài giảng" });
  }),
};

export default lessonController;
