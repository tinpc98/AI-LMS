import mongoose from "mongoose";
import { Class } from "#modules/class";
import { LessonProgress } from "#modules/lesson";
import LearningActivity from "../models/learningActivity.model.js";
import Attendance from "../models/attendance.model.js";
import Grade from "../models/grade.model.js";
import { Submission } from "#modules/assignment";
import ExamAttempt from "../models/examAttempt.model.js";
import { Assignment } from "#modules/assignment";
import Exam from "../models/exam.model.js";

class AnalyticsService {
  /**
   * Phân tích dữ liệu học tập cá nhân (Student Dashboard)
   */
  async getStudentAnalytics(classId, studentId) {
    const cid = new mongoose.Types.ObjectId(classId);
    const sid = new mongoose.Types.ObjectId(studentId);

    // 1. Tiến độ bài giảng
    const progressStats = await LessonProgress.aggregate([
      { $match: { classId: cid, studentId: sid } },
      {
        $group: {
          _id: null,
          totalProgress: { $sum: "$progress" },
          totalLearningTime: { $sum: "$totalLearningTime" },
          completedLessons: { $sum: { $cond: ["$completed", 1, 0] } },
          totalLessons: { $sum: 1 },
        },
      },
    ]);
    const progress = progressStats[0] || {
      totalProgress: 0,
      totalLearningTime: 0,
      completedLessons: 0,
      totalLessons: 0,
    };
    const averageProgress =
      progress.totalLessons > 0 ? (progress.totalProgress / progress.totalLessons).toFixed(2) : 0;

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
      if (stat._id === "Present") presentCount = stat.count;
      else if (stat._id === "Absent") absentCount = stat.count;
      else if (stat._id === "Late") lateCount = stat.count;
    });

    // 3. Bài tập
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
        totalLearningTime: progress.totalLearningTime, // seconds
        completedLessons: progress.completedLessons,
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
      trend: activityTrend.map((t) => ({ date: t._id, activities: t.count })),
    };
  }

  /**
   * Phân tích dữ liệu tổng quan lớp học (Teacher Dashboard)
   */
  async getTeacherAnalytics(classId) {
    const cid = new mongoose.Types.ObjectId(classId);

    // Tổng số học viên
    const classInfo = await Class.findById(cid).select("students");
    const totalStudents = classInfo?.students?.filter((s) => s.status === "Enrolled").length || 0;

    // 1. Tiến độ học tập trung bình của cả lớp
    const progressStats = await LessonProgress.aggregate([
      { $match: { classId: cid } },
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
    ]);
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
      if (stat._id === "Present") presentCount = stat.count;
      else if (stat._id === "Absent") absentCount = stat.count;
      else if (stat._id === "Late") lateCount = stat.count;
    });
    const totalAttendance = presentCount + absentCount + lateCount;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // 3. Bài tập (Tỉ lệ nộp và điểm TB)
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

    // 4. Low Progress Students (Dưới 30% tiến độ)
    const lowProgressStudents = await LessonProgress.aggregate([
      { $match: { classId: cid } },
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
    ]);

    return {
      overview: {
        totalStudents,
        classAvgProgress: parseFloat(classAvgProgress.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        assignmentAvgScore: parseFloat((gradeStats[0]?.avgScore || 0).toFixed(2)),
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
