import type {
  TodayClassItem,
  AssignmentSummaryItem,
  ExamSummaryItem,
  AnnouncementSummaryItem,
  AttendanceSummary,
} from "../types/learningDashboard.types";

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
      timeSlot: c.schedule || "08:00 - 10:30",
      status: isLiveNow ? "LIVE" : "UPCOMING",
    };
  });
};

export const mapAssignmentResponse = (rawAssignments: any[], classMap?: Map<string, string>): AssignmentSummaryItem[] => {
  if (!Array.isArray(rawAssignments)) return [];

  return rawAssignments.map((item: any) => {
    const dueDate = item.dueDate || item.createdAt || new Date().toISOString();
    const isSubmitted = Boolean(item.submission || item.isSubmitted);
    const isLate = dueDate && new Date(dueDate).getTime() < Date.now() && !isSubmitted;
    const classId = item.classId?._id || item.classId || "";
    const className = item.className || (classMap && classMap.get(classId)) || "Lớp học";

    return {
      id: item._id || item.id || `assign-${Math.random()}`,
      title: item.title || "Bài tập mới",
      className,
      classId,
      dueDate,
      status: isSubmitted ? "SUBMITTED" : isLate ? "LATE" : "PENDING",
      urgentPercent: isSubmitted ? 100 : Math.min(100, Math.max(15, Math.floor(Math.random() * 60) + 20)),
    };
  });
};

export const mapExamResponse = (rawExams: any[], classMap?: Map<string, string>): ExamSummaryItem[] => {
  if (!Array.isArray(rawExams)) return [];

  return rawExams.map((item: any) => {
    const classId = item.classId?._id || item.classId || "";
    const className = item.className || (classMap && classMap.get(classId)) || "Lớp học";

    return {
      id: item._id || item.id || `exam-${Math.random()}`,
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

  return rawAnnouncements.map((item: any) => ({
    id: item._id || item.id || `ann-${Math.random()}`,
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
