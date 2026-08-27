// File: src/modules/class/classProgress.repository.js
// Toàn bộ query Mongoose phục vụ tính tiến độ học tập. Không chứa công thức nghiệp vụ
// (nằm ở classProgressCalculator.js), không phụ thuộc req/res.
//
// LƯU Ý QUAN TRỌNG: softDelete.plugin.js chỉ tự động lọc `isDeleted: false` cho
// find/findOne/countDocuments/count — KHÔNG áp dụng cho aggregate. Mọi $match dưới đây
// phải tự khai báo điều kiện soft-delete.
//
// LƯU Ý QUAN TRỌNG #2 (đã từng là bug thật, sửa ở đây): Lesson và Assignment KHÔNG có
// field `classId` — chúng thuộc `topicId` (Topic thuộc `courseId`), và một Course có thể
// được dạy ở nhiều Class khác nhau. Bản cũ của file này query
// `Lesson.find({classId: {$in: cids}})` / `Assignment.find({classId: {$in: cids}})`,
// hai field không tồn tại trên schema — nên totalLessons/totalAssignments LUÔN LUÔN bằng 0,
// khiến computeClassProgress() luôn trả về null. Cách đúng là đi qua chuỗi quan hệ thật:
// Class.courseId -> Topic.courseId -> Lesson/Assignment.topicId.
import mongoose from "mongoose";
import Class from "./class.model.js";
import { Topic } from "#modules/topic";
import { Lesson } from "#modules/lesson";
import { LessonProgress } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { AssignmentAttempt } from "#modules/assignment";

const SUBMITTED_STATUSES = ["SUBMITTED", "GRADED"];

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));

/**
 * Với một danh sách classId, trả về danh sách lessonId/assignmentId thuộc khoá học
 * (courseId) của từng lớp — đi qua Class.courseId -> Topic.courseId -> Lesson/Assignment.topicId.
 * Chỉ lấy bài giảng/bài tập đã PUBLISHED và chưa bị xoá mềm.
 *
 * Các lớp cùng chung một courseId (dạy cùng khoá học nhưng khác ca/lịch) sẽ có cùng một
 * bộ lessonId/assignmentId — đúng bản chất: nội dung học thuộc về khoá học, không phải lớp.
 *
 * @param {Array<string|ObjectId>} classIds
 * @returns {Promise<Object>} { [classId]: { lessonIds: ObjectId[], assignmentIds: ObjectId[] } }
 */
export const resolveClassContentIds = async (classIds = []) => {
  const cids = classIds.map(toObjectId);
  const result = {};
  for (const cid of cids) result[String(cid)] = { lessonIds: [], assignmentIds: [] };

  if (cids.length === 0) return result;

  const classes = await Class.find({ _id: { $in: cids } })
    .select("_id courseId")
    .lean();
  if (classes.length === 0) return result;

  const courseIds = [...new Set(classes.map((c) => String(c.courseId)))];

  const topics = await Topic.find({ courseId: { $in: courseIds } })
    .select("_id courseId")
    .lean();
  const topicIdsByCourse = new Map();
  for (const t of topics) {
    const key = String(t.courseId);
    if (!topicIdsByCourse.has(key)) topicIdsByCourse.set(key, []);
    topicIdsByCourse.get(key).push(t._id);
  }
  const allTopicIds = topics.map((t) => t._id);

  const [lessons, assignments] = await Promise.all([
    allTopicIds.length
      ? Lesson.find({ topicId: { $in: allTopicIds }, status: "PUBLISHED" })
          .select("_id topicId")
          .lean()
      : [],
    allTopicIds.length
      ? Assignment.find({ topicId: { $in: allTopicIds }, status: "PUBLISHED" })
          .select("_id topicId")
          .lean()
      : [],
  ]);

  const lessonIdsByTopic = new Map();
  for (const l of lessons) {
    const key = String(l.topicId);
    if (!lessonIdsByTopic.has(key)) lessonIdsByTopic.set(key, []);
    lessonIdsByTopic.get(key).push(l._id);
  }
  const assignmentIdsByTopic = new Map();
  for (const a of assignments) {
    const key = String(a.topicId);
    if (!assignmentIdsByTopic.has(key)) assignmentIdsByTopic.set(key, []);
    assignmentIdsByTopic.get(key).push(a._id);
  }

  for (const cls of classes) {
    const courseKey = String(cls.courseId);
    const topicIds = topicIdsByCourse.get(courseKey) || [];
    const lessonIds = topicIds.flatMap((tid) => lessonIdsByTopic.get(String(tid)) || []);
    const assignmentIds = topicIds.flatMap((tid) => assignmentIdsByTopic.get(String(tid)) || []);
    result[String(cls._id)] = { lessonIds, assignmentIds };
  }

  return result;
};

/**
 * Gom số liệu thô cho tiến độ của một học sinh trên nhiều lớp.
 *
 * @param {string} studentId
 * @param {Array<string|ObjectId>} classIds
 * @returns {Promise<Object>} { [classId]: { totalLessons, lessonProgressSum, completedLessons, totalAssignments, submittedAssignments } }
 */
export const collectProgressTotals = async (studentId, classIds = []) => {
  if (!studentId || classIds.length === 0) return {};

  const sid = toObjectId(studentId);
  const cids = classIds.map(toObjectId);

  const contentByClass = await resolveClassContentIds(cids);

  const allLessonIds = [
    ...new Map(
      Object.values(contentByClass)
        .flatMap((c) => c.lessonIds)
        .map((id) => [String(id), id])
    ).values(),
  ];
  const allAssignmentIds = [
    ...new Map(
      Object.values(contentByClass)
        .flatMap((c) => c.assignmentIds)
        .map((id) => [String(id), id])
    ).values(),
  ];

  const [progressRows, submissionRows] = await Promise.all([
    allLessonIds.length
      ? LessonProgress.find({ studentId: sid, lessonId: { $in: allLessonIds } })
          .select("lessonId progress completed")
          .lean()
      : [],
    allAssignmentIds.length
      ? AssignmentAttempt.find({
          studentId: sid,
          assignmentId: { $in: allAssignmentIds },
          status: { $in: SUBMITTED_STATUSES },
        })
          .select("assignmentId")
          .lean()
      : [],
  ]);

  const progressByLesson = new Map(progressRows.map((r) => [String(r.lessonId), r.progress || 0]));
  const completedLessonIdSet = new Set(
    progressRows.filter((r) => r.completed).map((r) => String(r.lessonId))
  );
  const submittedAssignmentIdSet = new Set(submissionRows.map((r) => String(r.assignmentId)));

  const totals = {};
  for (const cid of cids) {
    const key = String(cid);
    const content = contentByClass[key] || { lessonIds: [], assignmentIds: [] };

    const lessonProgressSum = content.lessonIds.reduce(
      (sum, lessonId) => sum + (progressByLesson.get(String(lessonId)) || 0),
      0
    );
    const completedLessons = content.lessonIds.filter((id) =>
      completedLessonIdSet.has(String(id))
    ).length;
    const submittedAssignments = content.assignmentIds.filter((id) =>
      submittedAssignmentIdSet.has(String(id))
    ).length;

    totals[key] = {
      totalLessons: content.lessonIds.length,
      lessonProgressSum,
      completedLessons,
      totalAssignments: content.assignmentIds.length,
      submittedAssignments,
    };
  }

  return totals;
};

export default { collectProgressTotals, resolveClassContentIds };
