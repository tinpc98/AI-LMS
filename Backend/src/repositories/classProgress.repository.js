// File: src/repositories/classProgress.repository.js
// Toàn bộ query Mongoose phục vụ tính tiến độ học tập. Không chứa công thức nghiệp vụ
// (nằm ở services/classProgressCalculator.js), không phụ thuộc req/res.
//
// LƯU Ý QUAN TRỌNG: softDelete.plugin.js chỉ tự động lọc `isDeleted: false` cho
// find/findOne/countDocuments/count — KHÔNG áp dụng cho aggregate. Mọi $match dưới đây
// phải tự khai báo điều kiện soft-delete.
import mongoose from "mongoose";
import Lesson from "../models/lesson.model.js";
import LessonProgress from "../models/lessonProgress.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";

// Bài đã rút lại (withdrawn) không được tính là đã nộp.
const SUBMITTED_STATUSES = ["submitted", "late", "graded", "resubmitted"];

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));

/**
 * Gom số liệu thô cho tiến độ của một học sinh trên nhiều lớp.
 *
 * Dùng đúng 4 query bất kể số lớp đầu vào (không lặp query theo từng lớp). Hai query đầu
 * trả về luôn danh sách _id hợp lệ để hai query sau lọc theo lessonId/assignmentId — nhờ vậy
 * tiến độ trên bài giảng đã bị xoá/gỡ xuất bản không còn được cộng vào tử số.
 *
 * @param {string} studentId
 * @param {Array<string|ObjectId>} classIds
 * @returns {Promise<Object>} { [classId]: { totalLessons, lessonProgressSum, totalAssignments, submittedAssignments } }
 */
export const collectProgressTotals = async (studentId, classIds = []) => {
  if (!studentId || classIds.length === 0) return {};

  const sid = toObjectId(studentId);
  const cids = classIds.map(toObjectId);

  const [lessons, assignments] = await Promise.all([
    Lesson.find({ classId: { $in: cids }, isPublished: true, isDeleted: false })
      .select("_id classId")
      .lean(),
    Assignment.find({ classId: { $in: cids }, isDeleted: false })
      .select("_id classId")
      .lean(),
  ]);

  const lessonIds = lessons.map((l) => l._id);
  const assignmentIds = assignments.map((a) => a._id);

  const [progressRows, submissionRows] = await Promise.all([
    lessonIds.length
      ? LessonProgress.aggregate([
          { $match: { studentId: sid, lessonId: { $in: lessonIds } } },
          { $group: { _id: "$classId", lessonProgressSum: { $sum: "$progress" } } },
        ])
      : [],
    assignmentIds.length
      ? Submission.aggregate([
          {
            $match: {
              studentId: sid,
              assignmentId: { $in: assignmentIds },
              isDeleted: false,
              status: { $in: SUBMITTED_STATUSES },
            },
          },
          // Unique index {assignmentId, studentId} đảm bảo mỗi bài tập tối đa 1 submission
          // cho mỗi học sinh, nên đếm thẳng là an toàn, không cần $addToSet.
          { $group: { _id: "$classId", submittedAssignments: { $sum: 1 } } },
        ])
      : [],
  ]);

  const totals = {};
  const ensure = (classId) => {
    const key = String(classId);
    if (!totals[key]) {
      totals[key] = {
        totalLessons: 0,
        lessonProgressSum: 0,
        totalAssignments: 0,
        submittedAssignments: 0,
      };
    }
    return totals[key];
  };

  for (const cid of cids) ensure(cid);
  for (const lesson of lessons) ensure(lesson.classId).totalLessons += 1;
  for (const assignment of assignments) ensure(assignment.classId).totalAssignments += 1;
  for (const row of progressRows) ensure(row._id).lessonProgressSum = row.lessonProgressSum || 0;
  for (const row of submissionRows) ensure(row._id).submittedAssignments = row.submittedAssignments || 0;

  return totals;
};

export default { collectProgressTotals };
