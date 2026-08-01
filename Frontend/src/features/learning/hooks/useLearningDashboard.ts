import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../shared/hooks/useAuth";
import learningDashboardService from "../services/learningDashboard.service";
import type { LearningDashboardState } from "../types/learningDashboard.types";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

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
    gpa: 0,
    attendanceRate: 0,
    assignmentCompletionRate: 0,
    examPerformanceRate: 0,
  },
  learningScore: {
    score: 0,
    level: "Needs Improvement",
    trend: "stable",
    trendPercent: 0,
    feedback: "Chưa có dữ liệu để đánh giá năng lực học tập.",
  },
  attendance: {
    totalSessions: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    attendanceRate: 0,
  },
  assignments: [],
  exams: [],
  todayClasses: [],
  announcements: [],
  classProgress: [],
  learningInsight: {
    learningScore: 0,
    averageGrade: 0,
    attendanceRate: 0,
    assignmentCompletionRate: 0,
    examPerformanceRate: 0,
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
    } catch (err: unknown) {
      console.error("🚨 [useLearningDashboard] Error fetching dashboard data:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: getApiErrorMessage(err, "Không thể tải dữ liệu Learning Progress Dashboard."),
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
