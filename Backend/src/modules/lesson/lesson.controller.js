import Lesson from "./lesson.model.js";
import Topic from "../topic/topic.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// Helper check ownership (Topic -> Course -> createdBy)
const checkTopicTeacherOwnership = async (topicId, userId, role) => {
  if (role === "Admin" || role === "admin" || role === "ADMIN") return true;

  const topic = await Topic.findById(topicId).populate("courseId");
  if (!topic || !topic.courseId) return false;

  return topic.courseId.createdBy.toString() === userId.toString();
};

const lessonController = {
  createLesson: asyncHandler(async (req, res) => {
    let { topicId, classId, title, description, content, order, status, videoIds, documentIds } = req.body;
    const userId = req.user.id || req.user._id;

    if (!title) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc: Tiêu đề" });
    }

    if (!topicId && classId) {
      const classObj = await Class.findById(classId);
      if (!classObj) return res.status(404).json({ message: "Không tìm thấy lớp học" });
      
      let defaultTopic = await Topic.findOne({ courseId: classObj.courseId, name: "Migrated Lessons Topic" });
      if (!defaultTopic) {
        defaultTopic = await Topic.create({
          name: "Migrated Lessons Topic",
          courseId: classObj.courseId,
          description: "Default topic for class lessons",
          order: 999,
        });
      }
      topicId = defaultTopic._id;
    } else if (!topicId) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc: TopicId hoặc ClassId" });
    }

    const isAuthorized = await checkTopicTeacherOwnership(topicId, userId, req.user?.role);
    if (!isAuthorized) {
      return res.status(403).json({ message: "Bạn không có quyền tạo bài giảng cho Topic này!" });
    }

    const parsedOrder = order ? Number(order) : 0;
    
    // Nếu status là PUBLISHED, có thể check content block length
    if (status === "PUBLISHED") {
      if (!content || !Array.isArray(content) || content.length === 0) {
        return res.status(400).json({ message: "Bài giảng phải có nội dung (Content) trước khi Xuất bản." });
      }
    }

    const newLesson = new Lesson({
      topicId,
      title,
      description,
      content: content || [],
      videoIds: videoIds || [],
      documentIds: documentIds || [],
      order: parsedOrder,
      status: status || "DRAFT",
      createdBy: userId,
    });

    await newLesson.save();
    return res.status(201).json({ message: "Tạo bài giảng thành công", lesson: newLesson });
  }),

  // 2. LẤY DANH SÁCH BÀI GIẢNG THEO TOPIC
  getLessonsByTopic: asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const query = { topicId };

    if (role === "STUDENT") {
      query.status = "PUBLISHED";
      
      // Basic check: is Student enrolled in this Course via an Active Class?
      const topic = await Topic.findById(topicId);
      if (!topic) return res.status(404).json({ message: "Không tìm thấy Topic" });

      const classes = await Class.find({ courseId: topic.courseId, isDeleted: { $ne: true } }).select("_id");
      const classIds = classes.map(c => c._id);

      const isEnrolled = await ClassEnrollment.exists({
        studentId: userId,
        classId: { $in: classIds },
        status: "ACTIVE",
      });

      if (!isEnrolled) {
         return res.status(403).json({ message: "Bạn chưa tham gia lớp học nào thuộc khóa học này." });
      }
    }

    const lessons = await Lesson.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select("-content") // Không lấy full content ở list để tối ưu
      .lean();

    return res.status(200).json({ lessons });
  }),

  // 2.5 LẤY DANH SÁCH BÀI GIẢNG THEO CLASS
  getLessonsByClass: asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    if (role === "STUDENT") {
      const isEnrolled = await ClassEnrollment.exists({
        studentId: userId,
        classId: classId,
        status: "ACTIVE",
      });

      if (!isEnrolled) {
         return res.status(403).json({ message: "Bạn chưa tham gia lớp học này." });
      }
    }

    const topics = await Topic.find({ courseId: classObj.courseId }).select("_id");
    const topicIds = topics.map(t => t._id);

    const query = { topicId: { $in: topicIds } };
    if (role === "STUDENT") {
      query.status = "PUBLISHED";
    }

    const lessons = await Lesson.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select("-content")
      .lean();

    return res.status(200).json({ lessons });
  }),

  // 3. CHI TIẾT BÀI GIẢNG
  getLessonById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user?.role?.toUpperCase();

    const lesson = await Lesson.findById(id)
      .populate("videoIds")
      .populate("documentIds");

    if (!lesson) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    if (role === "STUDENT") {
      if (lesson.status !== "PUBLISHED") {
        return res.status(403).json({ message: "Bài giảng chưa được xuất bản" });
      }
      
      const topic = await Topic.findById(lesson.topicId);
      const classes = await Class.find({ courseId: topic.courseId, isDeleted: { $ne: true } }).select("_id");
      const classIds = classes.map(c => c._id);

      const isEnrolled = await ClassEnrollment.exists({
        studentId: userId,
        classId: { $in: classIds },
        status: "ACTIVE",
      });

      if (!isEnrolled) {
         return res.status(403).json({ message: "Bạn chưa tham gia lớp học nào thuộc khóa học chứa bài giảng này." });
      }
    } else {
      // Teacher / Admin check
      const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, req.user?.role);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập bài giảng này!" });
      }
    }

    return res.status(200).json({ lesson });
  }),

  // 4. CẬP NHẬT BÀI GIẢNG
  updateLesson: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, content, order, videoIds, documentIds } = req.body;
    const userId = req.user.id || req.user._id;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, req.user?.role);
    if (!isAuthorized) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa bài giảng này!",
      });
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (content !== undefined) lesson.content = content;
    if (order !== undefined) lesson.order = Number(order);
    if (videoIds !== undefined) lesson.videoIds = videoIds;
    if (documentIds !== undefined) lesson.documentIds = documentIds;

    await lesson.save();
    return res.status(200).json({ message: "Cập nhật bài giảng thành công", lesson });
  }),

  // 5. CẬP NHẬT TRẠNG THÁI BÀI GIẢNG
  updateLessonStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id || req.user._id;

    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: "Bài giảng không tồn tại" });
    }

    const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, req.user?.role);
    if (!isAuthorized) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa bài giảng này!",
      });
    }

    if (status === "PUBLISHED") {
      if (!lesson.content || lesson.content.length === 0) {
        return res.status(400).json({ message: "Bài giảng phải có nội dung trước khi Xuất bản." });
      }
    }

    lesson.status = status;
    await lesson.save();

    return res.status(200).json({ message: "Cập nhật trạng thái thành công", lesson });
  }),
};

export default lessonController;
