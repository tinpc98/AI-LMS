import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../dashboard.service";
import { queryKeys } from "../../../shared/api/queryKeys";
import type { OverviewCardItem } from "../dashboard.types";

export const useDashboardQuery = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: dashboardService.getAdminDashboard,
  });

  // Safe fallback for UI components
  const overviewCards: OverviewCardItem[] = [
    {
      key: "totalStudents",
      title: "Tổng Học Sinh",
      value: data?.activeStudents ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "đang hoạt động",
      color: "var(--color-action-primary-bg)",
      bgColor: "var(--color-bg-primary-tint)",
      iconName: "UserOutlined",
    },
    {
      key: "totalTeachers",
      title: "Tổng Giáo Viên",
      value: data?.activeTeachers ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "đang hoạt động",
      color: "var(--color-secondary-icon)",
      bgColor: "var(--color-secondary-bg)",
      iconName: "TeamOutlined",
    },
    {
      key: "totalCourses",
      title: "Tổng Khóa Học",
      value: data?.totalCourses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "var(--color-info-base)",
      bgColor: "var(--color-info-bg)",
      iconName: "BookOutlined",
    },
    {
      key: "totalClasses",
      title: "Tổng Lớp Học",
      value: data?.totalClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "var(--color-warning-base)",
      bgColor: "var(--color-warning-bg)",
      iconName: "SolutionOutlined",
    },
    {
      key: "activeClasses",
      title: "Lớp Đang Hoạt Động",
      value: data?.activeClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "trạng thái Ongoing",
      color: "var(--color-success-base)",
      bgColor: "var(--color-success-bg)",
      iconName: "CheckCircleOutlined",
    },
    {
      key: "unassignedClasses",
      title: "Chưa Phân Công GV",
      value: data?.unassignedClasses ?? 0,
      trend: 0,
      trendType: "down",
      trendLabel: "cần xếp lịch",
      color: "var(--color-warning-base)",
      bgColor: "var(--color-warning-bg)",
      iconName: "ClockCircleOutlined",
    },
    {
      key: "assignedClasses",
      title: "Đã Phân Công GV",
      value: data?.assignedClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "lớp đã xếp lịch",
      color: "var(--color-accent-base)",
      bgColor: "var(--color-accent-bg)",
      iconName: "CalendarOutlined",
    },
    {
      key: "totalUsers",
      title: "Tổng Tài Khoản",
      value: data?.totalUsers ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "var(--color-error-base)",
      bgColor: "var(--color-error-bg)",
      iconName: "SafetyCertificateOutlined",
    },
  ];

  return {
    data,
    loading: isLoading,
    error: error as Error | null,
    refetch,
    overviewCards,
    classStatusChart: data?.classStatusChart ?? [],
    courseDistribution: data?.courseDistribution ?? [],
    recentClasses: data?.recentClasses ?? [],
    recentUsers: data?.recentUsers ?? [],
    // Unsupported mock features return empty arrays
    registrationChart: (data?.studentRegistrationChart ?? []).map((item) => ({
      month: item.month,
      students: item.count,
    })),
    aiChart: [],
    activities: [],
  };
};
