import { classApi } from "../../../../api/classApi";
import assignmentApi from "../../../../api/assignmentApi";
import examApi from "../../../../api/examApi";
import announcementApi from "../../../../api/announcementApi";
import { attendanceApi } from "../../../../api/attendanceApi";
import gradeApi from "../../../../api/gradeApi";
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

    // 2. Fetch Assignments, Exams, Announcements across classes
    if (classList.length > 0) {
      const topClasses = classList.slice(0, 5);

      const [assResults, examResults, annResults] = await Promise.all([
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
    }

    const assignments = mapAssignmentResponse(rawAssignments, classMap);
    const exams = mapExamResponse(rawExams, classMap);
    const announcements = mapAnnouncementResponse(rawAnnouncements);

    // 3. Fetch Attendance & Grade Stats for Student
    let rawAttendance: any[] = [];
    let rawGrades: any[] = [];

    if (userId) {
      try {
        const attRes = await attendanceApi.getAttendanceByStudent(userId).catch(() => null);
        rawAttendance = attRes?.data?.data || [];
        const gradeRes = await gradeApi.getGradesByStudent(userId).catch(() => []);
        rawGrades = Array.isArray(gradeRes) ? gradeRes : [];
      } catch (e) {
        console.warn("[learningDashboardService] Attendance/Grade warning:", e);
      }
    }

    const attendance = mapAttendanceResponse(rawAttendance);
    const gpa = calculateAverageGrade(rawGrades);
    const assignmentCompletionRate = calculateCompletionRate(assignments);
    const examPerformanceRate = calculateExamPerformanceRate(exams);

    const statistics = {
      gpa,
      attendanceRate: attendance.attendanceRate,
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
        attendance.attendanceRate * 0.3 +
          assignmentCompletionRate * 0.35 +
          examPerformanceRate * 0.35
      ),
    };

    const classProgress = classList.map((c: any) => ({
      classId: c._id || c.id || "",
      className: c.className || c.name || "Lớp học",
      teacherName: c.teacherId?.fullName || c.teacherName || "Giảng viên",
      progressPercent: 88,
      attendanceRate: attendance.attendanceRate,
      grade: gpa,
      totalAssignments: 5,
      completedAssignments: 4,
    }));

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
    };
  },
};

export default learningDashboardService;
