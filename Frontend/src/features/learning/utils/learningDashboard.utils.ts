import type {
  LearningScore,
  LearningStatistics,
  AssignmentSummaryItem,
  ExamSummaryItem,
  LearningInsight,
} from "../types/learningDashboard.types";

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

  if (stats.attendanceRate < 80 || stats.assignmentCompletionRate < 70) {
    riskLevel = "high";
    recommendedActions.push("Liên hệ giảng viên môn học để bù bài chuyên cần.");
    recommendedActions.push("Hoàn thành ngay các bài tập chưa nộp để tránh bị trừ điểm.");
  } else if (stats.attendanceRate < 90 || stats.assignmentCompletionRate < 85) {
    riskLevel = "medium";
    recommendedActions.push("Đặt nhắc nhở xem lại bài giảng trước các buổi học.");
    recommendedActions.push("Dành thêm 30 phút mỗi ngày luyện đề trắc nghiệm AI.");
  } else {
    riskLevel = "low";
    recommendedActions.push("Tiếp tục duy trì phong độ và tham gia thảo luận nhóm tích cực.");
  }

  return {
    learningScore: score.score,
    averageGrade: stats.gpa,
    attendanceRate: stats.attendanceRate,
    assignmentCompletionRate: stats.assignmentCompletionRate,
    examPerformanceRate: stats.examPerformanceRate,
    weakSubjects: ["Cấu trúc dữ liệu & Giải thuật"],
    strongSubjects: ["Lập trình Web nâng cao", "Thiết kế UI/UX Enterprise"],
    upcomingDeadlines,
    riskLevel,
    recommendedActions,
  };
};

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
    const daysStr =
      Array.isArray(schedule.days) && schedule.days.length > 0
        ? schedule.days.join(", ")
        : typeof schedule.days === "string"
          ? schedule.days
          : "";

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
