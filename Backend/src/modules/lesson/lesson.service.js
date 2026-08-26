// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1) — tách logic CRUD Lesson ra service riêng (trước đây
// nằm thẳng trong controller); cần thiết vì logic block giờ có quy tắc thật cần kiểm (BR-1.1,
// BR-1.2) thay vì chỉ là pass-through field.
import Lesson from "./lesson.model.js";
import LessonProgress from "./lessonProgress.model.js";
import PracticeQuiz from "./practiceQuiz.model.js";
import { Topic } from "#modules/topic";
import Course from "../course/course.model.js";
import storageService from "#shared/services/storage.service.js";
import { NotFoundError, BusinessRuleError, AuthorizationError } from "#shared/utils/appError.js";

export const checkTopicTeacherOwnership = async (topicId, userId, role) => {
  if ((role || "").toLowerCase() === "admin") return true;

  const topic = await Topic.findById(topicId).populate("courseId");
  if (!topic || !topic.courseId) return false;

  return topic.courseId.createdBy.toString() === userId.toString();
};

/**
 * Kiểm tra hợp lệ 1 mảng blocks — BR-1.2 (tối đa 1 PRACTICE_QUIZ), và mỗi block phải có đúng
 * dữ liệu con khớp với `type` của nó (video/document/quizId).
 */
const validateBlocks = (blocks) => {
  if (!Array.isArray(blocks)) return;

  const quizBlocks = blocks.filter((b) => b.type === "PRACTICE_QUIZ");
  if (quizBlocks.length > 1) {
    throw new BusinessRuleError("Mỗi bài giảng chỉ được có tối đa 1 block Practice Quiz.");
  }

  for (const block of blocks) {
    if (block.type === "VIDEO" && !block.video?.externalId) {
      throw new BusinessRuleError("Block VIDEO thiếu thông tin video.");
    }
    if (block.type === "DOCUMENT" && !block.document?.publicId) {
      throw new BusinessRuleError("Block DOCUMENT thiếu thông tin tài liệu.");
    }
    if (block.type === "PRACTICE_QUIZ" && !block.quizId) {
      throw new BusinessRuleError("Block PRACTICE_QUIZ thiếu quizId.");
    }
  }
};

export const createLessonService = async (
  { topicId, title, description, content, blocks, order, status },
  userId,
  role
) => {
  if (!topicId) throw new BusinessRuleError("Thiếu topicId.");
  if (!title) throw new BusinessRuleError("Thiếu tiêu đề bài giảng.");

  const isAuthorized = await checkTopicTeacherOwnership(topicId, userId, role);
  if (!isAuthorized)
    throw new AuthorizationError("Bạn không có quyền tạo bài giảng cho Topic này!");

  validateBlocks(blocks);

  // BR-1.1: Lesson rỗng (0 block) không được publish.
  if (status === "PUBLISHED" && (!blocks || blocks.length === 0)) {
    throw new BusinessRuleError("Bài giảng phải có ít nhất 1 block trước khi Xuất bản.");
  }

  const lesson = new Lesson({
    topicId,
    title,
    description,
    content: content || [],
    blocks: blocks || [],
    order: order ? Number(order) : 0,
    status: status || "DRAFT",
    createdBy: userId,
  });

  await lesson.save();
  return lesson;
};

export const getLessonByIdService = async (id, userId, role) => {
  // Populate lồng questions.questionId để trả về ĐỦ nội dung câu hỏi (content/options) — chỉ
  // populate quizId thôi thì client chỉ có questionId trơ, không đủ dữ liệu để hiển thị quiz.
  const lesson = await Lesson.findById(id).populate({
    path: "blocks.quizId",
    select: "title questions",
    populate: { path: "questions.questionId", select: "type selectionMode content options" },
  });
  if (!lesson) throw new NotFoundError("Bài giảng không tồn tại.");
  return lesson;
};

export const updateLessonService = async (
  id,
  { title, description, content, blocks, order },
  userId,
  role
) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new NotFoundError("Bài giảng không tồn tại.");

  const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, role);
  if (!isAuthorized) throw new AuthorizationError("Bạn không có quyền sửa bài giảng này!");

  validateBlocks(blocks);

  if (title !== undefined) lesson.title = title;
  if (description !== undefined) lesson.description = description;
  if (content !== undefined) lesson.content = content;
  // BR-1.8: thêm block bắt buộc mới vào Lesson đã có người hoàn thành chỉ áp dụng cho học sinh
  // CHƯA hoàn thành — xử lý tự nhiên ở lessonProgress.service.js (completed=true không bao giờ
  // bị tính lại), không cần logic đặc biệt ở đây khi chỉ đổi danh sách block.
  if (blocks !== undefined) lesson.blocks = blocks;
  if (order !== undefined) lesson.order = Number(order);

  await lesson.save();
  return lesson;
};

export const updateLessonStatusService = async (id, status, userId, role) => {
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    throw new BusinessRuleError("Trạng thái không hợp lệ.");
  }

  const lesson = await Lesson.findById(id);
  if (!lesson) throw new NotFoundError("Bài giảng không tồn tại.");

  const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, role);
  if (!isAuthorized) throw new AuthorizationError("Bạn không có quyền sửa bài giảng này!");

  if (status === "PUBLISHED" && (!lesson.blocks || lesson.blocks.length === 0)) {
    throw new BusinessRuleError("Bài giảng phải có ít nhất 1 block trước khi Xuất bản.");
  }

  lesson.status = status;
  await lesson.save();
  return lesson;
};

/**
 * Xóa (mềm) 1 bài giảng — TÍNH NĂNG MỚI: trước đây frontend đã có nút xóa gọi DELETE /lessons/:id
 * nhưng route này chưa từng tồn tại (404 câm lặng). Chặn xóa nếu đã có học sinh phát sinh tiến độ
 * (LessonProgress) — cùng nguyên tắc bảo toàn dữ liệu lịch sử đã áp dụng cho Topic (chỉ archive
 * thay vì xóa, dùng PATCH /lessons/:id/status).
 */
export const deleteLessonService = async (id, userId, role) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new NotFoundError("Bài giảng không tồn tại.");

  const isAuthorized = await checkTopicTeacherOwnership(lesson.topicId, userId, role);
  if (!isAuthorized) throw new AuthorizationError("Bạn không có quyền xóa bài giảng này!");

  const progressCount = await LessonProgress.countDocuments({ lessonId: id });
  if (progressCount > 0) {
    throw new BusinessRuleError(
      "Bài giảng đã có học sinh học — không thể xóa để giữ toàn vẹn lịch sử tiến độ. Hãy chuyển sang trạng thái Lưu trữ (Archive) thay vì xóa."
    );
  }

  await lesson.softDelete(userId);
  return lesson;
};

const RESOURCE_TYPE_BY_MIME_PREFIX = (mime) => (mime?.startsWith("image/") ? "image" : "raw");

/**
 * Upload 1 file tài liệu (PDF/DOCX/PPTX/XLSX/ảnh) lên Cloudinary để giáo viên gắn vào 1 block
 * DOCUMENT — trả về publicId/fileType/bytes để client gửi kèm khi tạo/sửa block, KHÔNG lưu
 * thẳng vào Lesson ở bước này (giáo viên có thể upload rồi huỷ trước khi lưu block).
 */
export const uploadLessonDocumentService = async (file, userId) => {
  if (!file) throw new BusinessRuleError("Chưa có file được tải lên.");

  const resourceType = RESOURCE_TYPE_BY_MIME_PREFIX(file.detectedMime || file.mimetype);
  const result = await storageService.uploadFile(file.buffer, file.originalname, {
    folder: `eduspace/lessons/documents/${userId}`,
    resourceType,
  });

  return {
    publicId: result.publicId,
    fileType: result.format || "",
    bytes: result.bytes,
    title: file.originalname,
  };
};

/**
 * Tạo Practice Quiz — dùng để gán vào 1 block PRACTICE_QUIZ. Tách khỏi createLesson vì 1 quiz
 * có thể soạn trước rồi mới gắn vào block (giáo viên soạn câu hỏi trước, ráp bài giảng sau).
 */
export const createPracticeQuizService = async ({ title, questions }, userId) => {
  if (!title) throw new BusinessRuleError("Thiếu tiêu đề Practice Quiz.");
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new BusinessRuleError("Practice Quiz phải có ít nhất 1 câu hỏi.");
  }

  const quiz = await PracticeQuiz.create({
    title,
    questions: questions.map((q, idx) => ({ questionId: q.questionId, order: q.order ?? idx })),
    createdBy: userId,
  });
  return quiz;
};
