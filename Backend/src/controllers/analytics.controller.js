import mongoose from "mongoose";
import { sendSuccess, sendError } from "../utils/response.js";
import analyticsService from "../services/analytics.service.js";
import learningRankingService from "../services/learningRanking.service.js";

export const getStudentDashboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const analytics = await analyticsService.getStudentAnalytics(classId, studentId);
    return sendSuccess(res, "Lấy dữ liệu thống kê thành công", analytics);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy dữ liệu thống kê", 500);
  }
};

export const getTeacherDashboard = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const analytics = await analyticsService.getTeacherAnalytics(classId);
    return sendSuccess(res, "Lấy dữ liệu thống kê thành công", analytics);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy dữ liệu thống kê", 500);
  }
};

export const exportClassReportCSV = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    // Lấy ranking (có đủ điểm số các thành phần)
    const ranking = await learningRankingService.getClassRanking(classId, { limit: 10000 });

    let csvData = "Rank,Student Name,Email,Lesson XP,Attendance XP,Activity XP,Grade XP,Total XP\n";
    ranking.items.forEach((r) => {
      csvData += `${r.rank},"${r.fullName}","${r.email}",${r.lessonXP},${r.attendanceXP},${r.activityXP},${r.gradeXP},${r.totalXP}\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=Class_Report_${classId}.csv`);
    return res.status(200).send(Buffer.from("\uFEFF" + csvData, "utf-8")); // Add BOM cho Excel nhận UTF-8
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi xuất báo cáo", 500);
  }
};
