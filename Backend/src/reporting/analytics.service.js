import mongoose from "mongoose";
import { Class, resolveClassContentIds } from "#modules/class";
import { LessonProgress } from "#modules/lesson";
import { LearningActivity } from "#modules/badge";
import { Attendance } from "#modules/attendance";
import { Grade } from "#modules/grade";
import ClassEnrollment from "../modules/classEnrollment/classEnrollment.model.js";
import { AssignmentAttempt } from "#modules/assignment";
import { ExamAttempt } from "#modules/exam-attempt";
import { Assignment } from "#modules/assignment";
import { Exam } from "#modules/exam";

import { collectProgressTotals } from "#modules/class/classProgress.repository.js";
import { computeClassProgress } from "#modules/class/classProgressCalculator.js";

class AnalyticsService {
  /**
   * Phân tích dữ liệu học tập cá nhân (Student Dashboard)
   */
  async getStudentAnalytics(classId, studentId) {
    const cid = new mongoose.Types.ObjectId(classId);
    const sid = new mongoose.Types.ObjectId(studentId);

    // 1. Tiến độ học tập đồng bộ theo chuẩn hệ thống (Hybrid 50/50: Bài giảng + Bài tập)
    const progressTotalsMap = await collectProgressTotals(sid, [cid]);

    const classTotals = progressTotalsMap[String(classId)] || {
      totalLessons: 0,
      lessonProgressSum: 0,
      completedLessons: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
    };
    const averageProgress = computeClassProgress(classTotals);

    // 2. Điểm danh
    const attendanceStats = await Attendance.aggregate([
      { $match: { classId: cid, studentId: sid, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    attendanceStats.forEach((stat) => {
      if (stat._id === "PRESENT") presentCount = stat.count;
      else if (stat._id === "ABSENT") absentCount = stat.count;
      else if (stat._id === "LATE") lateCount = stat.count;
    });

    // 3. Bài tập & Bài thi
    const assignmentStats = await Grade.aggregate([
      { $match: { classId: cid, studentId: sid, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalScore: { $sum: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);
    const assignmentAvg =
      assignmentStats[0]?.count > 0
        ? (assignmentStats[0].totalScore / assignmentStats[0].count).toFixed(2)
        : 0;

    const classExams = await Exam.find({ classId: cid, isDeleted: false }).select("_id").lean();
    const examIds = classExams.map((e) => e._id);
    const examStats = await ExamAttempt.aggregate([
      {
        $match: {
          examId: { $in: examIds },
          studentId: sid,
          status: { $in: ["SUBMITTED", "GRADED", "PARTIALLY_GRADED"] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalScore: { $sum: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);
    const examAvg =
      examStats[0]?.count > 0 ? (examStats[0].totalScore / examStats[0].count).toFixed(2) : 0;

    // 4. Learning Trend (Hoạt động 7 ngày gần nhất)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityTrend = await LearningActivity.aggregate([
      { $match: { classId: cid, studentId: sid, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      progress: {
        averageProgress: parseFloat(averageProgress),
        completedLessons: classTotals.completedLessons,
        totalLessons: classTotals.totalLessons,
      },
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: presentCount + absentCount + lateCount,
      },
      assignment: {
        completed: assignmentStats[0]?.count || 0,
        averageScore: parseFloat(assignmentAvg),
      },
      exam: {
        completed: examStats[0]?.count || 0,
        averageScore: parseFloat(examAvg),
      },
      trend: activityTrend.map((t) => ({ date: t._id, activities: t.count })),
    };
  }

  /**
   * Phân tích dữ liệu tổng quan lớp học (Teacher Dashboard)
   */
  async getTeacherAnalytics(classId) {
    const cid = new mongoose.Types.ObjectId(classId);

    // Tổng số học viên
    const totalStudents = await ClassEnrollment.countDocuments({
      classId: cid,
      status: "ACTIVE",
    });

    // 1. Tiến độ học tập trung bình của cả lớp
    // Lesson không có field classId trực tiếp (thuộc courseId của Class qua Topic), nên phải
    // resolve danh sách lessonId của lớp trước khi match LessonProgress theo lessonId.
    const { lessonIds: classLessonIds } = (await resolveClassContentIds([cid]))[String(cid)] || {
      lessonIds: [],
    };

    const progressStats = classLessonIds.length
      ? await LessonProgress.aggregate([
          { $match: { lessonId: { $in: classLessonIds } } },
          {
            $group: {
              _id: "$studentId",
              avgProgress: { $avg: "$progress" },
            },
          },
          {
            $group: {
              _id: null,
              classAverage: { $avg: "$avgProgress" },
              studentsStarted: { $sum: 1 },
            },
          },
        ])
      : [];
    const classAvgProgress = progressStats[0]?.classAverage || 0;

    // 2. Tỉ lệ điểm danh trung bình
    const attendanceStats = await Attendance.aggregate([
      { $match: { classId: cid, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    attendanceStats.forEach((stat) => {
      if (stat._id === "PRESENT") presentCount = stat.count;
      else if (stat._id === "ABSENT") absentCount = stat.count;
      else if (stat._id === "LATE") lateCount = stat.count;
    });
    const totalAttendance = presentCount + absentCount + lateCount;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // 3. Bài tập & Bài thi (Tỉ lệ nộp và điểm TB)
    const gradeStats = await Grade.aggregate([
      { $match: { classId: cid, isDeleted: false } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          totalSubmissions: { $sum: 1 },
        },
      },
    ]);

    const classExams = await Exam.find({ classId: cid, isDeleted: false }).select("_id").lean();
    const examIds = classExams.map((e) => e._id);
    const examStats = await ExamAttempt.aggregate([
      {
        $match: {
          examId: { $in: examIds },
          status: { $in: ["SUBMITTED", "GRADED", "PARTIALLY_GRADED"] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          totalSubmissions: { $sum: 1 },
        },
      },
    ]);

    // 4. Low Progress Students (Dưới 30% tiến độ)
    const lowProgressStudents = classLessonIds.length
      ? await LessonProgress.aggregate([
          { $match: { lessonId: { $in: classLessonIds } } },
          {
            $group: {
              _id: "$studentId",
              avgProgress: { $avg: "$progress" },
            },
          },
          { $match: { avgProgress: { $lt: 30 } } },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "userInfo",
            },
          },
          { $unwind: "$userInfo" },
          {
            $project: {
              studentId: "$_id",
              fullName: "$userInfo.fullName",
              email: "$userInfo.email",
              avgProgress: { $round: ["$avgProgress", 1] },
            },
          },
          { $limit: 10 },
        ])
      : [];

    return {
      overview: {
        totalStudents,
        classAvgProgress: parseFloat(classAvgProgress.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        assignmentAvgScore: parseFloat((gradeStats[0]?.avgScore || 0).toFixed(2)),
        examAvgScore: parseFloat((examStats[0]?.avgScore || 0).toFixed(2)),
      },
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
      },
      lowProgressStudents,
    };
  }
}

export default new AnalyticsService();
