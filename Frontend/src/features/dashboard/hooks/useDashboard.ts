import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "../dashboard.service";
import type { DashboardData } from "../dashboard.types";

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,

    // Destructure aggregated values with safe defaults
    totalStudents: data?.totalStudents ?? 0,
    totalTeachers: data?.totalTeachers ?? 0,
    totalCourses: data?.totalCourses ?? 0,
    totalClasses: data?.totalClasses ?? 0,
    pendingAssignments: data?.pendingAssignments ?? 0,
    activeClasses: data?.activeClasses ?? 0,
    todayAIRequests: data?.todayAIRequests ?? 0,
    liveClasses: data?.liveClasses ?? 0,

    overviewCards: data?.overviewCards ?? [],
    registrationChart: data?.registrationChart ?? [],
    courseChart: data?.courseChart ?? [],
    classChart: data?.classChart ?? [],
    aiChart: data?.aiChart ?? [],
    todayClasses: data?.todayClasses ?? [],
    activities: data?.activities ?? [],
  };
};
