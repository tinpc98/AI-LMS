import { classApi } from "../../../api/classApi";
import assignmentApi from "../../../api/assignmentApi";
import examApi from "../../../api/examApi";
import announcementApi from "../../../api/announcementApi";
import analyticsApi from "../../../api/analyticsApi";
import gradeApi from "../../../api/gradeApi";
import {
  mapClassResponse,
  mapAssignmentResponse,
  mapExamResponse,
  mapAnnouncementResponse,
  mapAttendanceResponse,
} from "../mappers/learningDashboard.mapper";
import {
  calculateAverageGrade,
  calculateCompletionRate,
  calculateExamPerformanceRate,
  calculateLearningScore,
  calculateLearningInsights,
} from "../utils/learningDashboard.utils";
import type { LearningDashboardState } from "../types/learningDashboard.types";

export const learningDashboardService = {
  fetchDashboardData: async (
    userId?: string
  ): Promise<Omit<LearningDashboardState, "loading" | "error">> => {
    // 1. Fetch Enrolled Classes
    const classRes = await classApi.getMyClasses();
    const rawClasses = classRes.data?.data || classRes.data?.classList || classRes.data || [];
    const classList = Array.isArray(rawClasses) ? rawClasses : [];

    const todayClasses = mapClassResponse(classList);
    const classMap = new Map<string, string>();
    classList.forEach((c: any) => {
      if (c._id || c.id) classMap.set(c._id || c.id, c.className || c.name || "Lớp học");
    });

    let rawAssignments: any[] = [];
    let rawExams: any[] = [];
    let rawAnnouncements: any[] = [];
    let analyticsResults: any[] = [];
    let attendance: any = { attendanceRate: 0, presentCount: 0, totalCount: 0, records: [] };

    // 2. Fetch Assignments, Exams, Announcements across classes
    if (classList.length > 0) {
      const topClasses = classList.slice(0, 5);

      const [assResults, examResults, annResults, fetchedAnalytics] = await Promise.all([
        Promise.all(
          topClasses.map((c: any) =>
            assignmentApi.getAssignmentsByClass(c._id || c.id).catch(() => [])
          )
        ),
        Promise.all(
          topClasses.map((c: any) => examApi.getExamsByClass(c._id || c.id).catch(() => []))
        ),
        Promise.all(
          topClasses
            .slice(0, 3)
            .map((c: any) => announcementApi.getAnnouncementsByClass(c._id || c.id).catch(() => []))
        ),
        Promise.all(
          topClasses.map((c: any) =>
            analyticsApi.getStudentDashboard(c._id || c.id).catch(() => null)
          )
        ),
      ]);

      assResults.forEach((list) => {
        if (Array.isArray(list)) rawAssignments = [...rawAssignments, ...list];
      });

      examResults.forEach((list) => {
        if (Array.isArray(list)) rawExams = [...rawExams, ...list];
      });

      annResults.forEach((list) => {
        if (Array.isArray(list)) rawAnnouncements = [...rawAnnouncements, ...list];
      });

      analyticsResults = fetchedAnalytics;
    }

    const assignments = mapAssignmentResponse(rawAssignments, classMap);
    const exams = mapExamResponse(rawExams, classMap);
    const announcements = mapAnnouncementResponse(rawAnnouncements);

    // 3. Extract Analytics Stats
    let totalAssignmentScore = 0;
    let totalAssignmentsCount = 0;
    let totalPresent = 0;
    let totalAttendanceCount = 0;
    let totalExamScore = 0;
    let totalExamsCount = 0;

    if (classList.length > 0 && typeof analyticsResults !== "undefined") {
      analyticsResults.forEach((res: any) => {
        if (res && res.data) {
          const d = res.data;
          totalAssignmentScore += (d.assignment?.averageScore || 0) * (d.assignment?.completed || 0);
          totalAssignmentsCount += d.assignment?.completed || 0;
          totalPresent += d.attendance?.present || 0;
          totalAttendanceCount += d.attendance?.total || 0;
          totalExamScore += (d.exam?.averageScore || 0) * (d.exam?.completed || 0);
          totalExamsCount += d.exam?.completed || 0;
        }
      });
    }

    const gpa = totalAssignmentsCount > 0 ? totalAssignmentScore / totalAssignmentsCount : null;
    const attendanceRate = totalAttendanceCount > 0 ? (totalPresent / totalAttendanceCount) * 100 : 0;
    attendance.attendanceRate = attendanceRate;
    
    const examPerformanceRate = totalExamsCount > 0 ? totalExamScore / totalExamsCount : null;
    const assignmentCompletionRate = calculateCompletionRate(assignments);

    const statistics = {
      gpa,
      attendanceRate,
      assignmentCompletionRate,
      examPerformanceRate,
    };

    const learningScore = calculateLearningScore(statistics);
    const learningInsight = calculateLearningInsights(
      statistics,
      learningScore,
      assignments,
      exams
    );

    const pendingAssignmentsCount = assignments.filter(
      (a) => a.status === "PENDING" || a.status === "LATE"
    ).length;
    const upcomingExamsCount = exams.filter((e) => e.status === "NOT_STARTED").length;
    const unreadAnnouncementsCount = announcements.filter((a) => !a.isRead).length;

    const overview = {
      totalClasses: classList.length,
      completedClassesCount: 0,
      totalAssignmentsCount: assignments.length,
      pendingAssignmentsCount,
      upcomingExamsCount,
      unreadAnnouncementsCount,
      overallProgressPercent: Math.round(
        attendanceRate * 0.3 +
          (assignmentCompletionRate ?? 0) * 0.35 +
          (examPerformanceRate ?? 0) * 0.35
      ),
    };

    // Tính tiến độ nộp bài theo từng lớp dựa trên dữ liệu bài tập đã fetch (topClasses ≤ 5 lớp).
    // Lớp không có bài tập nào trong phạm vi fetch → progressPercent = null (“Chưa có dữ liệu”).
    const classProgress = classList.map((c: any) => {
      const classId = c._id || c.id || "";
      const classAssignments = assignments.filter((a) => a.classId === classId);
      const totalAss = classAssignments.length;
      const completedAss = classAssignments.filter((a) => a.status === "SUBMITTED").length;
      return {
        classId,
        className: c.className || c.name || "Lớp học",
        teacherName: c.teacherId?.fullName || c.teacherName || "Giảng viên",
        progressPercent: totalAss > 0 ? Math.round((completedAss / totalAss) * 100) : null,
        attendanceRate: attendance.attendanceRate,
        grade: gpa,
        totalAssignments: totalAss,
        completedAssignments: completedAss,
      };
    });

    return {
      overview,
      statistics,
      learningScore,
      attendance,
      assignments,
      exams,
      todayClasses,
      announcements,
      classProgress,
      learningInsight,
      rawClasses: classList,
    };
  },
};

export default learningDashboardService;
