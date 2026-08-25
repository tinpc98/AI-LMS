import LessonProgress from "./lessonProgress.model.js";
import Lesson from "./lesson.model.js";
import { Topic } from "#modules/topic";
import Enrollment from "../enrollment/enrollment.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// Đánh dấu hoàn thành hoặc bỏ hoàn thành
export const updateLessonProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { completed, progress: rawProgress } = req.body;
  const studentId = req.user.id || req.user._id;

  // progress granular (0-100) chỉ dùng khi client gửi kèm; hiện chưa có UI nào gửi giá trị
  // này (chỉ có toggle hoàn thành), nên mặc định quy đổi từ completed: xong = 100, chưa = 0.
  const progress =
    typeof rawProgress === "number" && Number.isFinite(rawProgress)
      ? Math.min(100, Math.max(0, rawProgress))
      : completed
        ? 100
        : 0;

  // 1. Kiểm tra bài giảng có tồn tại không
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return res.status(404).json({ message: "Không tìm thấy bài giảng" });
  }

  // 2. Kiểm tra quyền truy cập (Enrollment)
  const topic = await Topic.findById(lesson.topicId);
  if (!topic) {
    return res.status(404).json({ message: "Không tìm thấy Topic chứa bài giảng" });
  }

  const isEnrolled = await Enrollment.findOne({
    studentId,
    courseId: topic.courseId,
    status: "ACTIVE",
  });
  if (!isEnrolled) {
    return res.status(403).json({ message: "Bạn chưa đăng ký khóa học chứa bài giảng này." });
  }

  // 3. Cập nhật hoặc tạo mới
  let progressDoc = await LessonProgress.findOne({ studentId, lessonId });

  if (!progressDoc) {
    progressDoc = new LessonProgress({
      studentId,
      lessonId,
      completed: Boolean(completed),
      completedAt: completed ? new Date() : null,
      progress,
    });
  } else {
    progressDoc.completed = Boolean(completed);
    progressDoc.completedAt = completed ? new Date() : null;
    progressDoc.progress = progress;
  }

  await progressDoc.save();
  return res.status(200).json({ message: "Cập nhật tiến độ thành công", progress: progressDoc });
});

// Lấy tiến độ của học sinh trong 1 Topic
export const getStudentTopicProgress = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const studentId = req.user.id || req.user._id;

  // Lấy tất cả bài giảng PUBLISHED trong topic
  const lessons = await Lesson.find({ topicId, status: "PUBLISHED" }).select("_id").lean();
  const lessonIds = lessons.map((l) => l._id);

  // Tìm tiến độ của các bài giảng đó
  const progresses = await LessonProgress.find({
    studentId,
    lessonId: { $in: lessonIds },
  }).lean();

  return res.status(200).json({ progresses });
});
