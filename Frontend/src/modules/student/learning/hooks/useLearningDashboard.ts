import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../../hooks/useAuth";
import learningDashboardService from "../services/learningDashboard.service";
import type { LearningDashboardState } from "../types/learningDashboard.types";

const defaultState: LearningDashboardState = {
  overview: {
    totalClasses: 0,
    completedClassesCount: 0,
    totalAssignmentsCount: 0,
    pendingAssignmentsCount: 0,
    upcomingExamsCount: 0,
    unreadAnnouncementsCount: 0,
    overallProgressPercent: 0,
  },
  statistics: {
    gpa: 8.4,
    attendanceRate: 92,
    assignmentCompletionRate: 88,
    examPerformanceRate: 85,
  },
  learningScore: {
    score: 88,
    level: "Good",
    trend: "up",
    trendPercent: 5.2,
    feedback: "Bạn đang giữ phong độ học tập tốt. Hãy tiếp tục duy trì!",
  },
  attendance: {
    totalSessions: 12,
    presentCount: 11,
    lateCount: 1,
    absentCount: 0,
    excusedCount: 0,
    attendanceRate: 92,
  },
  assignments: [],
  exams: [],
  todayClasses: [],
  announcements: [],
  classProgress: [],
  learningInsight: {
    learningScore: 88,
    averageGrade: 8.4,
    attendanceRate: 92,
    assignmentCompletionRate: 88,
    examPerformanceRate: 85,
    weakSubjects: [],
    strongSubjects: [],
    upcomingDeadlines: [],
    riskLevel: "low",
    recommendedActions: [],
  },
  loading: true,
  error: null,
};

export function useLearningDashboard() {
  const { user } = useAuth();
  const userId = user?.id || (user as any)?._id;

  const [state, setState] = useState<LearningDashboardState>(defaultState);

  const fetchDashboard = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await learningDashboardService.fetchDashboardData(userId);
      setState({
        ...data,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("🚨 [useLearningDashboard] Error fetching dashboard data:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || "Không thể tải dữ liệu Learning Progress Dashboard.",
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...state,
    refresh: fetchDashboard,
  };
}

export default useLearningDashboard;
