// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1) — thay thế cơ chế "tự khai báo hoàn thành" cũ
// (updateLessonProgress nhận thẳng completed:true/false từ client, không kiểm gì) bằng theo
// dõi THẬT theo từng block: video phải xem đủ %, tài liệu phải mở đủ lâu, quiz phải đạt điểm.
import Lesson from "./lesson.model.js";
import LessonProgress from "./lessonProgress.model.js";
import PracticeQuiz from "./practiceQuiz.model.js";
import PracticeQuizAttempt from "./practiceQuizAttempt.model.js";
import { Topic } from "#modules/topic";
import { Question } from "#modules/question";
import { Enrollment } from "#modules/enrollment";
import storageService from "#shared/services/storage.service.js";
import { NotFoundError, BusinessRuleError, AuthorizationError } from "#shared/utils/appError.js";
// Import trực tiếp file, KHÔNG qua #modules/badge — barrel đó còn re-export learningRanking.service.js
// (kéo theo Class/Attendance/Grade/ClassEnrollment), trong khi ở đây chỉ cần vài hàm thuần liên
// quan XP. Cùng nguyên tắc "tránh over-eager barrel export" đã áp dụng cho topic.service.js.
import { awardXpService, resolveActiveClassIdForStudent } from "../badge/xp.service.js";
import { XP_TABLE } from "../badge/xp.js";
import {
  computeWatchedUnionSeconds,
  isVideoBlockComplete,
  isDocumentBlockComplete,
  isQuizBlockComplete,
  computeLessonCompletion,
} from "./lessonBlockProgress.js";

/**
 * Học sinh phải đã đăng ký (đóng tiền + được xếp lớp) khóa học chứa bài giảng — cùng quy tắc
 * đã sửa ở lessonProgress.controller.js (BUG ĐÃ SỬA cũ: "ACTIVE" không tồn tại trong enum
 * Enrollment.status), gom lại 1 chỗ vì giờ có 4 endpoint cần dùng chung thay vì 1.
 */
const assertEnrolled = async (studentId, courseId) => {
  const isEnrolled = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ["APPROVED", "CLASS_ASSIGNED"] },
  });
  if (!isEnrolled) {
    throw new AuthorizationError("Bạn chưa đăng ký khóa học chứa bài giảng này.");
  }
};

/**
 * Nạp Lesson + Topic (lấy courseId để kiểm enrollment) + tìm đúng block theo blockId, xác nhận
 * đúng loại. Dùng chung cho cả 3 hàm ghi tiến độ bên dưới.
 */
const loadLessonBlockForStudent = async (lessonId, blockId, studentId, expectedType) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new NotFoundError("Không tìm thấy bài giảng.");

  const block = lesson.blocks.id(blockId);
  if (!block) throw new NotFoundError("Không tìm thấy block trong bài giảng.");
  if (block.type !== expectedType) {
    throw new BusinessRuleError(`Block này không phải loại ${expectedType}.`);
  }

  const topic = await Topic.findById(lesson.topicId).lean();
  if (!topic) throw new NotFoundError("Không tìm thấy Topic chứa bài giảng.");

  await assertEnrolled(studentId, topic.courseId);

  return { lesson, block, courseId: topic.courseId };
};

/**
 * Tính lại completed/progress toàn Lesson và ghi vào progressDoc — BR-1.7: KHÔNG bao giờ đổi
 * completed từ true về false (một khi đã hoàn thành thì giữ nguyên, kể cả khi giáo viên thêm
 * block bắt buộc mới sau đó — BR-1.8).
 *
 * TÍNH NĂNG MỚI (mục 5): cộng 20 XP "Lesson Completed" đúng 1 lần khi completed chuyển
 * false -> true lần đầu (sourceRef theo lessonId nên gọi lại không cộng trùng).
 */
const recomputeLessonProgress = async (progressDoc, lesson, studentId, courseId) => {
  if (progressDoc.completed) return; // Đã hoàn thành — không tính lại, không thu hồi.

  const { completed, progress } = computeLessonCompletion(lesson.blocks, progressDoc.blocks);
  progressDoc.progress = progress;
  if (completed) {
    progressDoc.completed = true;
    progressDoc.completedAt = new Date();

    const classId = await resolveActiveClassIdForStudent(courseId, studentId);
    if (classId) {
      await awardXpService({
        studentId,
        classId,
        lessonId: lesson._id,
        activityType: "Lesson Completed",
        sourceRef: `lesson:${lesson._id}`,
        xpAmount: XP_TABLE.LESSON_COMPLETED,
      });
    }
  }
};

const findOrCreateProgress = async (studentId, lessonId) => {
  let progressDoc = await LessonProgress.findOne({ studentId, lessonId });
  if (!progressDoc) {
    progressDoc = new LessonProgress({ studentId, lessonId });
  }
  return progressDoc;
};

// Khởi tạo tường minh field theo từng loại thay vì trông cậy Mongoose tự điền default khi
// push subdocument — rõ ràng hơn và không phụ thuộc cơ chế hydrate ngầm.
const initBlockProgressByType = (type) => {
  if (type === "VIDEO") return { watchedRanges: [], watchedSeconds: 0 };
  if (type === "DOCUMENT") return { firstOpenedAt: null, totalOpenSeconds: 0 };
  if (type === "PRACTICE_QUIZ") return { bestScorePercent: null };
  return {};
};

const findOrInitBlockProgress = (progressDoc, blockId, type) => {
  let bp = progressDoc.blocks.find((b) => String(b.blockId) === String(blockId));
  if (!bp) {
    bp = { blockId, type, completed: false, ...initBlockProgressByType(type) };
    progressDoc.blocks.push(bp);
    bp = progressDoc.blocks[progressDoc.blocks.length - 1];
  }
  return bp;
};

/**
 * Ghi nhận 1 đoạn video đã xem [start,end] giây — gọi định kỳ từ player phía client (BR-1.4:
 * ghi tiến độ mỗi 15 giây theo đặc tả, tần suất do client quyết định, service chỉ cộng dồn).
 */
export const recordVideoProgressService = async (lessonId, blockId, studentId, { start, end }) => {
  if (typeof start !== "number" || typeof end !== "number" || end <= start) {
    throw new BusinessRuleError("Khoảng thời gian xem không hợp lệ.");
  }

  const { lesson, block, courseId } = await loadLessonBlockForStudent(
    lessonId,
    blockId,
    studentId,
    "VIDEO"
  );
  const progressDoc = await findOrCreateProgress(studentId, lessonId);
  const bp = findOrInitBlockProgress(progressDoc, blockId, "VIDEO");

  bp.watchedRanges.push({ start, end });
  bp.watchedSeconds = computeWatchedUnionSeconds(bp.watchedRanges);
  if (!bp.completed && isVideoBlockComplete(bp.watchedSeconds, block.video.durationSeconds)) {
    bp.completed = true;
    bp.completedAt = new Date();
  }

  await recomputeLessonProgress(progressDoc, lesson, studentId, courseId);
  await progressDoc.save();
  return progressDoc;
};

const IMAGE_FILE_TYPES = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/**
 * publicId luôn đọc từ Lesson.blocks[].document (bản ghi đã xác thực qua
 * loadLessonBlockForStudent), KHÔNG bao giờ nhận trực tiếp từ client — tránh lớp lỗi IDOR đã
 * từng gặp ở chat.controller.js#getAttachmentSignedUrl (ở đó phải chặn bằng cách so khớp tiền
 * tố thư mục vì publicId do client tự truyền lên).
 */
export const recordDocumentOpenService = async (lessonId, blockId, studentId) => {
  const { lesson, block, courseId } = await loadLessonBlockForStudent(
    lessonId,
    blockId,
    studentId,
    "DOCUMENT"
  );
  const progressDoc = await findOrCreateProgress(studentId, lessonId);
  const bp = findOrInitBlockProgress(progressDoc, blockId, "DOCUMENT");

  if (!bp.firstOpenedAt) bp.firstOpenedAt = new Date();

  await recomputeLessonProgress(progressDoc, lesson, studentId, courseId);
  await progressDoc.save();

  const resourceType = IMAGE_FILE_TYPES.has((block.document.fileType || "").toLowerCase())
    ? "image"
    : "raw";
  const { signedUrl, expiresAt } = storageService.getSignedUrl(block.document.publicId, {
    resourceType,
    format: block.document.fileType,
  });

  return { progress: progressDoc, documentUrl: signedUrl, documentUrlExpiresAt: expiresAt };
};

/**
 * Học sinh đóng tài liệu (rời trang / đóng modal) sau khi đã mở — client tự tính số giây đã mở
 * (Date.now() - thời điểm mở) rồi gửi lên, tương tự cách markAttendance ghi durationSeconds.
 */
export const recordDocumentCloseService = async (
  lessonId,
  blockId,
  studentId,
  { openedSeconds }
) => {
  if (typeof openedSeconds !== "number" || openedSeconds < 0) {
    throw new BusinessRuleError("Thời gian mở tài liệu không hợp lệ.");
  }

  const { lesson, courseId } = await loadLessonBlockForStudent(
    lessonId,
    blockId,
    studentId,
    "DOCUMENT"
  );
  const progressDoc = await findOrCreateProgress(studentId, lessonId);
  const bp = findOrInitBlockProgress(progressDoc, blockId, "DOCUMENT");

  bp.totalOpenSeconds += openedSeconds;
  if (!bp.completed && isDocumentBlockComplete(bp.totalOpenSeconds)) {
    bp.completed = true;
    bp.completedAt = new Date();
  }

  await recomputeLessonProgress(progressDoc, lesson, studentId, courseId);
  await progressDoc.save();
  return progressDoc;
};

/**
 * Nộp 1 lượt làm Practice Quiz — chấm tự động ngay (chỉ MCQ/TRUE_FALSE, xem practiceQuiz.model.js
 * về lý do), trả về đáp án đúng NGAY LẬP TỨC cho từng câu (khác Assignment/Exam — đây là học,
 * không phải đánh giá). BR-1.6: không giới hạn số lần làm, điểm ghi nhận là lần cao nhất.
 */
export const submitPracticeQuizAttemptService = async (
  lessonId,
  blockId,
  studentId,
  { answers }
) => {
  const { lesson, block, courseId } = await loadLessonBlockForStudent(
    lessonId,
    blockId,
    studentId,
    "PRACTICE_QUIZ"
  );

  const quiz = await PracticeQuiz.findById(block.quizId).lean();
  if (!quiz) throw new NotFoundError("Không tìm thấy Practice Quiz.");

  const questionIds = quiz.questions.map((q) => q.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } }).lean();
  const questionById = new Map(questions.map((q) => [String(q._id), q]));

  const answerByQuestionId = new Map((answers || []).map((a) => [String(a.questionId), a]));

  let correctCount = 0;
  const gradedAnswers = quiz.questions.map((qq) => {
    const question = questionById.get(String(qq.questionId));
    const submitted = answerByQuestionId.get(String(qq.questionId));
    const selected = submitted?.selectedOptionIds || [];

    // Cùng logic MCQ/TRUE_FALSE đã dùng cho Assignment/Exam trong toàn hệ thống — khớp CHÍNH
    // XÁC tập đáp án đúng, không thừa không thiếu.
    const correctOptionIds = (question?.options || []).filter((o) => o.isCorrect).map((o) => o.id);
    const isCorrect =
      question != null &&
      selected.length === correctOptionIds.length &&
      selected.every((id) => correctOptionIds.includes(id));

    if (isCorrect) correctCount++;

    return {
      questionId: qq.questionId,
      selectedOptionIds: selected,
      isCorrect,
      // BR-1.4: hiện đáp án ngay sau mỗi câu — trả kèm luôn đáp án đúng thật để UI hiện được.
      correctOptionIds,
    };
  });

  const scorePercent =
    quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;

  const existingAttemptCount = await PracticeQuizAttempt.countDocuments({
    quizId: quiz._id,
    studentId,
  });
  const attempt = await PracticeQuizAttempt.create({
    quizId: quiz._id,
    lessonId,
    studentId,
    attemptNumber: existingAttemptCount + 1,
    answers: gradedAnswers.map(({ questionId, selectedOptionIds, isCorrect }) => ({
      questionId,
      selectedOptionIds,
      isCorrect,
    })),
    scorePercent,
  });

  const progressDoc = await findOrCreateProgress(studentId, lessonId);
  const bp = findOrInitBlockProgress(progressDoc, blockId, "PRACTICE_QUIZ");
  const previousBest = bp.bestScorePercent ?? 0;
  bp.bestScorePercent = Math.max(previousBest, scorePercent);

  // TÍNH NĂNG MỚI (mục 5): 10 XP đúng 1 lần khi lần ĐẦU TIÊN đạt ngưỡng 70% (không cộng lại ở
  // các lần làm lại sau, dù điểm có thay đổi) + 5 XP thưởng đúng 1 lần khi lần ĐẦU TIÊN đạt 100%.
  const classId = await resolveActiveClassIdForStudent(courseId, studentId);
  if (classId) {
    if (isQuizBlockComplete(bp.bestScorePercent) && !isQuizBlockComplete(previousBest)) {
      await awardXpService({
        studentId,
        classId,
        lessonId,
        activityType: "Practice Quiz Passed",
        sourceRef: `quiz-pass:${blockId}`,
        xpAmount: XP_TABLE.PRACTICE_QUIZ_PASSED,
      });
    }
    if (bp.bestScorePercent >= 100 && previousBest < 100) {
      await awardXpService({
        studentId,
        classId,
        lessonId,
        activityType: "Practice Quiz Passed",
        sourceRef: `quiz-perfect:${blockId}`,
        xpAmount: XP_TABLE.PRACTICE_QUIZ_PERFECT_BONUS,
        metadata: { bonus: "perfect_score" },
      });
    }
  }

  if (!bp.completed && isQuizBlockComplete(bp.bestScorePercent)) {
    bp.completed = true;
    bp.completedAt = new Date();
  }

  await recomputeLessonProgress(progressDoc, lesson, studentId, courseId);
  await progressDoc.save();

  return {
    attempt,
    gradedAnswers,
    scorePercent,
    bestScorePercent: bp.bestScorePercent,
    progress: progressDoc,
  };
};

export const getStudentTopicProgressService = async (topicId, studentId) => {
  const lessons = await Lesson.find({ topicId, status: "PUBLISHED" }).select("_id").lean();
  const lessonIds = lessons.map((l) => l._id);

  return LessonProgress.find({ studentId, lessonId: { $in: lessonIds } }).lean();
};

/**
 * Lấy tiến độ của học sinh cho 1 danh sách lessonId cụ thể — dùng cho sidebar danh sách bài
 * giảng của 1 Class (Lesson thuộc Topic, không thuộc Class trực tiếp, nên không có sẵn 1 query
 * "theo classId" — client tự gom lessonIds từ danh sách bài giảng đã tải rồi gọi hàm này).
 */
export const getProgressForLessonsService = async (lessonIds, studentId) => {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) return [];
  return LessonProgress.find({ studentId, lessonId: { $in: lessonIds } }).lean();
};
