import { asyncHandler } from "#shared/utils/asyncHandler.js";
import {
  recordVideoProgressService,
  recordDocumentOpenService,
  recordDocumentCloseService,
  submitPracticeQuizAttemptService,
  getStudentTopicProgressService,
  getProgressForLessonsService,
} from "./lessonProgress.service.js";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1.5) — thay cho updateLessonProgress cũ (tự khai báo
// completed:true/false không kiểm chứng gì). Mỗi loại block có 1 endpoint ghi tiến độ riêng,
// hoàn thành Lesson được TÍNH LẠI từ dữ liệu thật, không nhận trực tiếp từ client.

export const recordVideoProgress = asyncHandler(async (req, res) => {
  const { lessonId, blockId } = req.params;
  const { start, end } = req.body;
  const studentId = req.user.id || req.user._id;

  const progress = await recordVideoProgressService(lessonId, blockId, studentId, { start, end });
  return res.status(200).json({ message: "Đã ghi nhận tiến độ xem video", progress });
});

export const recordDocumentOpen = asyncHandler(async (req, res) => {
  const { lessonId, blockId } = req.params;
  const studentId = req.user.id || req.user._id;

  const { progress, documentUrl, documentUrlExpiresAt } = await recordDocumentOpenService(
    lessonId,
    blockId,
    studentId
  );
  return res
    .status(200)
    .json({ message: "Đã ghi nhận mở tài liệu", progress, documentUrl, documentUrlExpiresAt });
});

export const recordDocumentClose = asyncHandler(async (req, res) => {
  const { lessonId, blockId } = req.params;
  const { openedSeconds } = req.body;
  const studentId = req.user.id || req.user._id;

  const progress = await recordDocumentCloseService(lessonId, blockId, studentId, {
    openedSeconds,
  });
  return res.status(200).json({ message: "Đã ghi nhận thời gian đọc tài liệu", progress });
});

export const submitPracticeQuizAttempt = asyncHandler(async (req, res) => {
  const { lessonId, blockId } = req.params;
  const { answers } = req.body;
  const studentId = req.user.id || req.user._id;

  const result = await submitPracticeQuizAttemptService(lessonId, blockId, studentId, { answers });
  return res.status(200).json({ message: "Đã nộp bài Practice Quiz", ...result });
});

// Lấy tiến độ của học sinh trong 1 Topic
export const getStudentTopicProgress = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const studentId = req.user.id || req.user._id;

  const progresses = await getStudentTopicProgressService(topicId, studentId);
  return res.status(200).json({ progresses });
});

// Lấy tiến độ của học sinh cho 1 danh sách lessonId cụ thể (sidebar danh sách bài giảng của Class)
export const getProgressForLessons = asyncHandler(async (req, res) => {
  const { lessonIds } = req.body;
  const studentId = req.user.id || req.user._id;

  const progresses = await getProgressForLessonsService(lessonIds, studentId);
  return res.status(200).json({ progresses });
});
