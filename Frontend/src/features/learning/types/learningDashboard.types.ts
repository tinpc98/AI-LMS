// Core Data Interfaces for Learning Progress Dashboard (AI Ready)

export interface LearningOverview {
  totalClasses: number;
  completedClassesCount: number;
  totalAssignmentsCount: number;
  pendingAssignmentsCount: number;
  upcomingExamsCount: number;
  unreadAnnouncementsCount: number;
  overallProgressPercent: number; // 0 - 100
}

export interface LearningStatistics {
  gpa: number | null; // Scale 0 - 10; null = chưa có dữ liệu điểm
  attendanceRate: number; // Percent %
  assignmentCompletionRate: number | null; // Percent %; null = chưa có bài tập nào
  examPerformanceRate: number | null; // Percent %; null = chưa có kết quả thi
}

export interface LearningScore {
  score: number; // Overall score 0 - 100
  level: "Excellent" | "Good" | "Average" | "Needs Improvement";
  trend: "up" | "down" | "stable";
  trendPercent: number;
  feedback: string;
}

export interface AttendanceSummary {
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface AssignmentSummaryItem {
  id: string;
  title: string;
  className: string;
  classId: string;
  dueDate: string;
  status: "SUBMITTED" | "PENDING" | "LATE";
  urgentPercent: number;
}

export interface ExamSummaryItem {
  id: string;
  title: string;
  className: string;
  startTime: string;
  duration: number; // minutes
  maxScore: number;
  score: number | null;
  status: "COMPLETED" | "NOT_STARTED";
}

export interface TodayClassItem {
  id: string;
  className: string;
  courseName: string;
  teacherName: string;
  teacherAvatar?: string;
  timeSlot: string;
  status: "LIVE" | "UPCOMING" | "ENDED";
}

export interface AnnouncementSummaryItem {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  isPinned: boolean;
  isRead: boolean;
}

export interface ClassProgressItem {
  classId: string;
  className: string;
  teacherName: string;
  /** null = lớp này không có bài tập nào trong dữ liệu hiện tại */
  progressPercent: number | null;
  attendanceRate: number;
  grade: number | null;
  totalAssignments: number;
  completedAssignments: number;
}

// AI Ready Prepared Data Object
export interface LearningInsight {
  learningScore: number;
  averageGrade: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
  examPerformanceRate: number;
  weakSubjects: string[];
  strongSubjects: string[];
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    type: "assignment" | "exam";
  }>;
  riskLevel: "low" | "medium" | "high";
  recommendedActions: string[];
}

export interface LearningDashboardState {
  overview: LearningOverview;
  statistics: LearningStatistics;
  learningScore: LearningScore;
  attendance: AttendanceSummary;
  assignments: AssignmentSummaryItem[];
  exams: ExamSummaryItem[];
  todayClasses: TodayClassItem[];
  announcements: AnnouncementSummaryItem[];
  classProgress: ClassProgressItem[];
  learningInsight: LearningInsight;
  loading: boolean;
  error: string | null;
}
