import type {
  LearningScore,
  LearningStatistics,
  AssignmentSummaryItem,
  ExamSummaryItem,
  LearningInsight,
} from "../types/learningDashboard.types";
import { formatDayOfWeek } from "../../../shared/utils/labelFormatters";

export const calculateAverageGrade = (rawGrades: any[]): number | null => {
  if (!Array.isArray(rawGrades) || rawGrades.length === 0) return null;
  const total = rawGrades.reduce((acc, curr) => acc + (curr.score || 0), 0);
  return Number((total / rawGrades.length).toFixed(2));
};

export const calculateAttendanceRate = (attendanceRate?: number): number => {
  return attendanceRate !== undefined && attendanceRate !== null ? attendanceRate : 0;
};

export const calculateCompletionRate = (assignments: AssignmentSummaryItem[]): number | null => {
  if (!assignments || assignments.length === 0) return null;
  const submittedCount = assignments.filter((a) => a.status === "SUBMITTED").length;
  return Math.round((submittedCount / assignments.length) * 100);
};

export const calculateExamPerformanceRate = (exams: ExamSummaryItem[]): number | null => {
  if (!exams || exams.length === 0) return null;
  const completedExams = exams.filter((e) => e.score !== null);
  if (completedExams.length === 0) return null;
  const avgScore =
    completedExams.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedExams.length;
  return Math.round((avgScore / 10) * 100);
};

export const calculateLearningScore = (stats: LearningStatistics): LearningScore => {
  // Dùng ?? 0 để giữ nguyên công thức GPA(40%) + Nộp bài(35%) + Chuyên cần(25%).
  // Khi null nghĩa là "chưa có dữ liệu", tương đương 0 trong tính toán.
  const gpaPercent = ((stats.gpa ?? 0) / 10) * 100;
  const overall = Math.round(
    stats.attendanceRate * 0.25 + (stats.assignmentCompletionRate ?? 0) * 0.35 + gpaPercent * 0.4
  );

  let level: LearningScore["level"] = "Good";
  let feedback = "Bạn đang giữ phong độ học tập tốt. Hãy tiếp tục duy trì!";

  if (overall >= 90) {
    level = "Excellent";
    feedback = "Xuất sắc! Bạn có kết quả học tập tuyệt vời và độ chuyên cần rất cao.";
  } else if (overall >= 75) {
    level = "Good";
    feedback = "Khá tốt! Hãy cố gắng nộp bài đúng hạn và ôn luyện đều đặn hơn nữa.";
  } else if (overall >= 60) {
    level = "Average";
    feedback = "Trung bình. Cần tập trung cải thiện tỷ lệ nộp bài tập và đi học đúng giờ.";
  } else {
    level = "Needs Improvement";
    feedback = "Cảnh báo học tập. Hãy gặp giảng viên hoặc trợ giảng để nhận hỗ trợ học tập.";
  }

  return {
    score: Math.min(100, Math.max(0, overall)),
    level,
    trend: overall >= 80 ? "up" : overall >= 60 ? "stable" : "down",
    trendPercent: 5.2,
    feedback,
  };
};

export const calculateLearningInsights = (
  stats: LearningStatistics,
  score: LearningScore,
  assignments: AssignmentSummaryItem[],
  exams: ExamSummaryItem[]
): LearningInsight => {
  const upcomingDeadlines: LearningInsight["upcomingDeadlines"] = [];

  assignments.forEach((a) => {
    if (a.status === "PENDING" || a.status === "LATE") {
      upcomingDeadlines.push({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        type: "assignment",
      });
    }
  });

  exams.forEach((e) => {
    if (e.status === "NOT_STARTED") {
      upcomingDeadlines.push({
        id: e.id,
        title: e.title,
        dueDate: e.startTime,
        type: "exam",
      });
    }
  });

  let riskLevel: LearningInsight["riskLevel"] = "low";
  const recommendedActions: string[] = [];

  const attendanceRate = stats.attendanceRate ?? 0;
  const assignmentCompletionRate = stats.assignmentCompletionRate ?? 0;

  if (attendanceRate < 80 || assignmentCompletionRate < 70) {
    riskLevel = "high";
    recommendedActions.push("Liên hệ giảng viên môn học để bù bài chuyên cần.");
    recommendedActions.push("Hoàn thành ngay các bài tập chưa nộp để tránh bị trừ điểm.");
  } else if (attendanceRate < 90 || assignmentCompletionRate < 85) {
    riskLevel = "medium";
    recommendedActions.push("Đặt nhắc nhở xem lại bài giảng trước các buổi học.");
    recommendedActions.push("Dành thêm 30 phút mỗi ngày luyện đề trắc nghiệm AI.");
  } else {
    riskLevel = "low";
    recommendedActions.push("Tiếp tục duy trì phong độ và tham gia thảo luận nhóm tích cực.");
  }

  return {
    learningScore: score.score,
    averageGrade: stats.gpa ?? 0,
    attendanceRate,
    assignmentCompletionRate,
    examPerformanceRate: stats.examPerformanceRate ?? 0,
    weakSubjects: ["Cấu trúc dữ liệu & Giải thuật"],
    strongSubjects: ["Lập trình Web nâng cao", "Thiết kế UI/UX Enterprise"],
    upcomingDeadlines,
    riskLevel,
    recommendedActions,
  };
};

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

// Define default timezone for the application
const TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Tái sử dụng để định dạng dữ liệu schedule (string hoặc object) thành chuỗi hiển thị an toàn cho React
 * Tránh lỗi Runtime: Objects are not valid as a React child
 */
export function formatSchedule(schedule: any): string {
  if (!schedule) {
    return "08:00 - 10:30";
  }

  if (typeof schedule === "string") {
    return schedule;
  }

  if (typeof schedule === "object") {
    const rawDays = Array.isArray(schedule.days)
      ? schedule.days
      : typeof schedule.days === "string"
        ? [schedule.days]
        : [];

    // formatDayOfWeek was imported at top
    const daysStr = rawDays.map((d: string) => d).join(", "); // Temporary fallback if formatDayOfWeek is missing

    const startTime = schedule.startTime || "";
    const endTime = schedule.endTime || "";
    const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "";

    if (daysStr && timeStr) {
      return `${daysStr} (${timeStr})`;
    }
    if (daysStr) {
      return daysStr;
    }
    if (timeStr) {
      return timeStr;
    }
  }

  return "08:00 - 10:30";
}

/**
 * Returns the exact next session timestamp and formatted string for a class.
 */
export function getNextSessionInfo(schedule: any) {
  if (!schedule || !Array.isArray(schedule.days) || schedule.days.length === 0 || !schedule.startTime) {
    return { timestamp: 9999999999999, displayString: "Không có lịch học" };
  }

  const now = dayjs().tz(TIMEZONE);
  const currentDayName = now.format("dddd"); // "Monday", "Tuesday", etc.
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Parse start and end times
  const [startHour, startMin] = schedule.startTime.split(":").map(Number);
  const [endHour, endMin] = (schedule.endTime || "23:59").split(":").map(Number);

  const candidates: { diff: number, display: string, time: dayjs.Dayjs }[] = [];

  for (const day of schedule.days) {
    const targetDayIndex = daysOfWeek.indexOf(day);
    if (targetDayIndex === -1) continue;

    let targetDate = now.day(targetDayIndex);
    
    // Set the specific time
    let sessionStart = targetDate.hour(startHour).minute(startMin).second(0);
    let sessionEnd = targetDate.hour(endHour).minute(endMin).second(0);

    // If it's today, check if it's already over
    if (day === currentDayName) {
      if (now.isAfter(sessionEnd)) {
        // If passed, next session for this day is next week
        sessionStart = sessionStart.add(1, 'week');
      }
    } else if (targetDate.isBefore(now, 'day')) {
      // If the day is earlier in the week, it means next week
      sessionStart = sessionStart.add(1, 'week');
    }

    candidates.push({
      diff: sessionStart.diff(now, 'minute'),
      display: `${formatDayOfWeek(day, true)}, ${sessionStart.format('DD/MM')} · ${schedule.startTime}`,
      time: sessionStart
    });
  }

  if (candidates.length === 0) {
    return { timestamp: 9999999999999, displayString: "Không xác định" };
  }

  // Sort by closest to now
  candidates.sort((a, b) => a.diff - b.diff);

  return {
    timestamp: candidates[0].time.valueOf(),
    displayString: candidates[0].display
  };
}

/**
 * Sắp xếp các lớp học sao cho lớp có ca học (session) gần với thời gian hiện tại nhất sẽ được đẩy lên đầu tiên.
 */
export function sortClassesByUpcomingSession(classes: any[]) {
  const now = dayjs().tz(TIMEZONE);

  return [...classes].sort((a, b) => {
    const getScore = (cls: any) => {
      // Classes already finished
      if (cls.endDate && dayjs(cls.endDate).isBefore(now, 'day')) return 9999999999999;
      // Classes not started
      if (cls.startDate && dayjs(cls.startDate).isAfter(now, 'day')) return 9999999999998;

      if (!cls.schedule || !cls.schedule.startTime || !cls.schedule.endTime) return 8888888888888;
      
      const hasSessionToday = cls.schedule.days?.includes(now.format("dddd"));
      
      if (hasSessionToday) {
        const [startHour, startMin] = cls.schedule.startTime.split(":").map(Number);
        const [endHour, endMin] = cls.schedule.endTime.split(":").map(Number);
        
        const startTime = now.clone().hour(startHour).minute(startMin).second(0);
        const endTime = now.clone().hour(endHour).minute(endMin).second(0);

        // Đang học -> Điểm ưu tiên cao nhất (0)
        if (now.isBetween(startTime, endTime, null, "[]")) {
          return 0;
        }
      }
      
      // Fallback to absolute timestamp of next session
      const nextSession = getNextSessionInfo(cls.schedule);
      return nextSession.timestamp - now.valueOf(); // Positive number of ms in future
    };

    return getScore(a) - getScore(b);
  });
}
