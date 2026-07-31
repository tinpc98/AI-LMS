import mongoose from "mongoose";
import { Class } from "#modules/class";
import LessonProgress from "../models/lessonProgress.model.js";
import LearningActivity from "../models/learningActivity.model.js";
import Attendance from "../models/attendance.model.js";
import Grade from "../models/grade.model.js";

class LearningRankingService {
  /**
   * Tính điểm số (XP) của một học sinh trong một lớp
   */
  async getStudentXP(classId, studentId) {
    const cid = new mongoose.Types.ObjectId(classId);
    const sid = new mongoose.Types.ObjectId(studentId);

    // Điểm bài giảng (Lesson Progress)
    const progressXP = await LessonProgress.aggregate([
      { $match: { classId: cid, studentId: sid } },
      { $group: { _id: null, totalProgress: { $sum: "$progress" } } },
    ]);
    const lessonXP = progressXP.length ? progressXP[0].totalProgress : 0;

    // Điểm danh (Attendance) - 10 XP mỗi lần có mặt
    const attendanceXP =
      (await Attendance.countDocuments({
        classId: cid,
        studentId: sid,
        status: "Present",
        isDeleted: false,
      })) * 10;

    // Điểm hoạt động (LearningActivity) - 1 XP mỗi hoạt động
    const activityXP = await LearningActivity.countDocuments({
      classId: cid,
      studentId: sid,
    });

    // Điểm bài tập / Bài thi (Grade)
    const gradeXP = await Grade.aggregate([
      { $match: { classId: cid, studentId: sid, isDeleted: false } },
      { $group: { _id: null, totalGrade: { $sum: "$score" } } },
    ]);
    const totalGradeXP = gradeXP.length ? gradeXP[0].totalGrade : 0;

    return lessonXP + attendanceXP + activityXP + totalGradeXP;
  }

  /**
   * Lấy Bảng xếp hạng của lớp học (Aggregation tối ưu)
   */
  async getClassRanking(classId, queryOptions = {}) {
    const cid = new mongoose.Types.ObjectId(classId);
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 20, 10)));

    // Aggregation pipeline tối ưu từ Class -> Students
    const pipeline = [
      { $match: { _id: cid, isDeleted: false } },
      { $unwind: "$students" },
      { $match: { "students.status": "Enrolled" } },
      { $replaceRoot: { newRoot: "$students" } },

      // Lookup Lesson Progress
      {
        $lookup: {
          from: "lessonprogresses",
          let: { sid: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$classId", cid] }, { $eq: ["$studentId", "$$sid"] }] },
              },
            },
            { $group: { _id: null, totalProgress: { $sum: "$progress" } } },
          ],
          as: "progressStats",
        },
      },

      // Lookup Attendance
      {
        $lookup: {
          from: "attendances",
          let: { sid: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$classId", cid] },
                    { $eq: ["$studentId", "$$sid"] },
                    { $eq: ["$status", "Present"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "attendanceStats",
        },
      },

      // Lookup Activity
      {
        $lookup: {
          from: "learningactivities",
          let: { sid: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$classId", cid] }, { $eq: ["$studentId", "$$sid"] }] },
              },
            },
            { $count: "count" },
          ],
          as: "activityStats",
        },
      },

      // Lookup Grades
      {
        $lookup: {
          from: "grades",
          let: { sid: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$classId", cid] },
                    { $eq: ["$studentId", "$$sid"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $group: { _id: null, totalScore: { $sum: "$score" } } },
          ],
          as: "gradeStats",
        },
      },

      // Project and Calculate XP
      {
        $project: {
          studentId: 1,
          lessonXP: { $ifNull: [{ $arrayElemAt: ["$progressStats.totalProgress", 0] }, 0] },
          attendanceXP: {
            $multiply: [{ $ifNull: [{ $arrayElemAt: ["$attendanceStats.count", 0] }, 0] }, 10],
          },
          activityXP: { $ifNull: [{ $arrayElemAt: ["$activityStats.count", 0] }, 0] },
          gradeXP: { $ifNull: [{ $arrayElemAt: ["$gradeStats.totalScore", 0] }, 0] },
        },
      },
      {
        $addFields: {
          totalXP: { $add: ["$lessonXP", "$attendanceXP", "$activityXP", "$gradeXP"] },
        },
      },

      // Lookup User Info
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          studentId: 1,
          fullName: "$userInfo.fullName",
          email: "$userInfo.email",
          avatar: "$userInfo.avatar",
          lessonXP: 1,
          attendanceXP: 1,
          activityXP: 1,
          gradeXP: 1,
          totalXP: 1,
        },
      },
      { $sort: { totalXP: -1, fullName: 1 } },
    ];

    const ranking = await Class.aggregate(pipeline);

    // Apply Ranking Position
    ranking.forEach((r, index) => {
      r.rank = index + 1;
    });

    const totalItems = ranking.length;
    const items = ranking.slice((page - 1) * limit, page * limit);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Lấy Rank của một học sinh cụ thể
   */
  async getStudentRanking(classId, studentId) {
    const fullRanking = await this.getClassRanking(classId, { page: 1, limit: 10000 });
    const studentRank = fullRanking.items.find(
      (r) => r.studentId.toString() === studentId.toString()
    );
    return studentRank || null;
  }
}

export default new LearningRankingService();
