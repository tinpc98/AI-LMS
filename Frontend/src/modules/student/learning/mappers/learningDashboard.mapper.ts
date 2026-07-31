import type {
  TodayClassItem,
  AssignmentSummaryItem,
  ExamSummaryItem,
  AnnouncementSummaryItem,
  AttendanceSummary,
} from "../types/learningDashboard.types";

import {
  calculateAverageGrade,
  calculateCompletionRate,
  calculateExamPerformanceRate,
  calculateLearningScore,
  calculateLearningInsights,
  formatSchedule,
} from "../utils/learningDashboard.utils";
import type { LearningDashboardState } from "../types/learningDashboard.types";

export const mapClassResponse = (rawClasses: any[]): TodayClassItem[] => {
  if (!Array.isArray(rawClasses)) return [];

  return rawClasses.map((c: any) => {
    const isLiveNow = Boolean(c.isLiveSessionActive || c.liveRoomId);
    const classIdStr = c._id || c.id || "";
    return {
      id: classIdStr,
      className: c.className || c.name || "Lớp học",
      courseName: c.subject || c.courseId?.name || "Khóa học môn chuyên ngành",
      teacherName: c.teacherId?.fullName || c.teacherName || "Giảng viên phụ trách",
      teacherAvatar: c.teacherId?.avatar || c.teacherAvatar,
      timeSlot: formatSchedule(c.schedule),
      status: isLiveNow ? "LIVE" : "UPCOMING",
    };
  });
};

// Cửa sổ thời gian để quy đổi "còn bao lâu tới hạn" thành mức khẩn cấp 0-100.
// Bài tập còn hơn 7 ngày coi như chưa gấp; càng sát hạn giá trị càng cao.
const URGENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const computeUrgentPercent = (dueDate: string, isSubmitted: boolean): number => {
  if (isSubmitted) return 100;

  const msLeft = new Date(dueDate).getTime() - Date.now();
  if (!Number.isFinite(msLeft)) return 0;
  if (msLeft <= 0) return 100; // đã quá hạn

  const ratio = 1 - msLeft / URGENCY_WINDOW_MS;
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
};

export const mapAssignmentResponse = (
  rawAssignments: any[],
  classMap?: Map<string, string>
): AssignmentSummaryItem[] => {
  if (!Array.isArray(rawAssignments)) return [];

  return rawAssignments.map((item: any, index: number) => {
    const dueDate = item.dueDate || item.createdAt || new Date().toISOString();
    const isSubmitted = Boolean(item.submission || item.isSubmitted);
    const isLate = dueDate && new Date(dueDate).getTime() < Date.now() && !isSubmitted;
    const classId = item.classId?._id || item.classId || "";
    const className = item.className || (classMap && classMap.get(classId)) || "Lớp học";

    return {
      // Fallback dùng index thay vì Math.random(): key ngẫu nhiên sẽ đổi sau MỖI lần render,
      // khiến React huỷ và dựng lại toàn bộ item thay vì tái sử dụng.
      id: item._id || item.id || `assign-${index}`,
      title: item.title || "Bài tập mới",
      className,
      classId,
      dueDate,
      status: isSubmitted ? "SUBMITTED" : isLate ? "LATE" : "PENDING",
      // Suy ra từ hạn nộp thật thay vì số ngẫu nhiên (Wave 1.1).
      urgentPercent: computeUrgentPercent(dueDate, isSubmitted),
    };
  });
};

export const mapExamResponse = (
  rawExams: any[],
  classMap?: Map<string, string>
): ExamSummaryItem[] => {
  if (!Array.isArray(rawExams)) return [];

  return rawExams.map((item: any, index: number) => {
    const classId = item.classId?._id || item.classId || "";
    const className = item.className || (classMap && classMap.get(classId)) || "Lớp học";

    return {
      id: item._id || item.id || `exam-${index}`,
      title: item.title || "Bài kiểm tra đánh giá",
      className,
      startTime: item.startTime || item.createdAt || new Date().toISOString(),
      duration: item.duration || 45,
      maxScore: item.maxScore || 10,
      score: item.score !== undefined && item.score !== null ? item.score : null,
      status: item.score !== undefined && item.score !== null ? "COMPLETED" : "NOT_STARTED",
    };
  });
};

export const mapAnnouncementResponse = (rawAnnouncements: any[]): AnnouncementSummaryItem[] => {
  if (!Array.isArray(rawAnnouncements)) return [];

  return rawAnnouncements.map((item: any, index: number) => ({
    id: item._id || item.id || `ann-${index}`,
    title: item.title || "Thông báo từ giảng viên",
    content: item.content || "",
    authorName: item.createdBy?.fullName || item.authorName || "Giảng viên",
    authorAvatar: item.createdBy?.avatar || item.authorAvatar,
    createdAt: item.createdAt || new Date().toISOString(),
    isPinned: item.scope === "System" || Boolean(item.isPinned),
    isRead: Boolean(item.isRead),
  }));
};

export const mapAttendanceResponse = (rawAttendance: any[]): AttendanceSummary => {
  if (!Array.isArray(rawAttendance) || rawAttendance.length === 0) {
    return {
      totalSessions: 12,
      presentCount: 11,
      lateCount: 1,
      absentCount: 0,
      excusedCount: 0,
      attendanceRate: 92,
    };
  }

  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  rawAttendance.forEach((item: any) => {
    const status = (item.status || "").toUpperCase();
    if (status === "PRESENT") present++;
    else if (status === "LATE") late++;
    else if (status === "ABSENT") absent++;
    else if (status === "EXCUSED") excused++;
  });

  const total = rawAttendance.length;
  const rate = total > 0 ? Math.round(((present + late * 0.7 + excused * 0.9) / total) * 100) : 100;

  return {
    totalSessions: total,
    presentCount: present,
    lateCount: late,
    absentCount: absent,
    excusedCount: excused,
    attendanceRate: Math.min(100, rate),
  };
};
