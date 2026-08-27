// File: src/modules/class/cohortReadiness.service.js
// BR-15/BR-16 — chuẩn "module buổi học khép kín": chặn chuyển cohort sang CONFIRMED nếu chưa
// đủ số buổi có đầy đủ thành phần cho phép giáo viên dự bị/thay thế dạy được ngay.
//
// Chỉ kiểm 4/5 thành phần của BR-15 tại thời điểm này (mục tiêu, học liệu, bài tập, đáp án) —
// thành phần thứ 5 ("ghi chú tiến độ buổi trước") KHÔNG THỂ tồn tại trước khi cohort bắt đầu
// (buổi 1 không có "buổi trước"), nên nó được sinh ra ở RUNTIME lúc bàn giao (BR-17), không
// phải điều kiện tiên quyết để CONFIRMED — đây là một chỗ sửa lại cho nhất quán so với cách
// diễn đạt gốc trong đặc tả (Phần B.3), không phải bỏ sót.
import { Topic } from "#modules/topic";
import { Lesson } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import Class from "./class.model.js";
import { NotFoundError, BusinessRuleError } from "#shared/utils/appError.js";

/**
 * Một Lesson được coi là "sẵn sàng" khi có đủ 4 thành phần:
 *   1. Mục tiêu buổi học -> Lesson.description không rỗng
 *   2. Học liệu chính -> Lesson.content không rỗng
 *   3. Bài tập/hoạt động -> có Assignment cùng topicId
 *   4. Đáp án/hướng dẫn chấm -> Assignment đó có solutionResources không rỗng
 */
function evaluateLessonReadiness(lesson, assignmentsByTopic) {
  const missingParts = [];

  if (!lesson.description || !lesson.description.trim()) {
    missingParts.push("mục tiêu buổi học (description)");
  }
  if (!Array.isArray(lesson.content) || lesson.content.length === 0) {
    missingParts.push("học liệu chính (content)");
  }

  const relatedAssignment = assignmentsByTopic.get(lesson.topicId.toString());
  if (!relatedAssignment) {
    missingParts.push("bài tập/hoạt động (chưa có Assignment cùng topicId)");
  } else if (
    !Array.isArray(relatedAssignment.solutionResources) ||
    relatedAssignment.solutionResources.length === 0
  ) {
    missingParts.push("đáp án/hướng dẫn chấm (Assignment.solutionResources)");
  }

  return {
    lessonId: lesson._id,
    title: lesson.title,
    ready: missingParts.length === 0,
    missingParts,
  };
}

/**
 * Kiểm tra khóa học của lớp có đủ số buổi "sẵn sàng" (đủ 4 thành phần) bằng đúng
 * cohortSessionCount hay không.
 *
 * @returns {{ ready: boolean, sessionCount: number, readyLessonCount: number, details: object[] }}
 */
export async function checkCohortLearningMaterialsReady(classId) {
  const classDoc = await Class.findById(classId).lean();
  if (!classDoc) {
    throw new NotFoundError("Lớp học không tồn tại.");
  }
  if (!classDoc.cohortSessionCount) {
    throw new BusinessRuleError(
      "Lớp chưa khai báo cohortSessionCount, không thể kiểm tra học liệu."
    );
  }

  const topics = await Topic.find({ courseId: classDoc.courseId }).select("_id").lean();
  const topicIds = topics.map((t) => t._id);

  const [lessons, assignments] = await Promise.all([
    Lesson.find({ topicId: { $in: topicIds }, status: "PUBLISHED" })
      .select("_id title topicId description content")
      .lean(),
    Assignment.find({ topicId: { $in: topicIds }, status: "PUBLISHED" })
      .select("topicId solutionResources")
      .lean(),
  ]);

  const assignmentsByTopic = new Map(assignments.map((a) => [a.topicId.toString(), a]));

  const details = lessons.map((lesson) => evaluateLessonReadiness(lesson, assignmentsByTopic));
  const readyLessonCount = details.filter((d) => d.ready).length;

  return {
    ready: readyLessonCount >= classDoc.cohortSessionCount,
    sessionCount: classDoc.cohortSessionCount,
    readyLessonCount,
    details,
  };
}

/**
 * Ném BusinessRuleError với danh sách buổi còn thiếu nếu chưa đủ điều kiện — dùng trực tiếp
 * trong transitionCommitment trước khi cho phép chuyển sang CONFIRMED.
 */
export async function assertCohortReadyForConfirmation(classId) {
  const result = await checkCohortLearningMaterialsReady(classId);
  if (!result.ready) {
    const notReady = result.details.filter((d) => !d.ready);
    throw new BusinessRuleError(
      `Chưa đủ ${result.sessionCount} buổi có đầy đủ học liệu (hiện có ${result.readyLessonCount}). ` +
        `Các buổi còn thiếu: ${notReady
          .map((d) => `"${d.title}" (${d.missingParts.join(", ")})`)
          .join("; ")}`
    );
  }
  return result;
}
