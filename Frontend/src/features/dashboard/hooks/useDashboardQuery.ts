import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../dashboard.service";
import type { OverviewCardItem } from "../dashboard.types";

export const useDashboardQuery = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
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
      color: "#1677ff",
      bgColor: "#e6f4ff",
      iconName: "UserOutlined",
    },
    {
      key: "totalTeachers",
      title: "Tổng Giáo Viên",
      value: data?.activeTeachers ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "đang hoạt động",
      color: "#722ed1",
      bgColor: "#f9f0ff",
      iconName: "TeamOutlined",
    },
    {
      key: "totalCourses",
      title: "Tổng Khóa Học",
      value: data?.totalCourses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "#13c2c2",
      bgColor: "#e6fffb",
      iconName: "BookOutlined",
    },
    {
      key: "totalClasses",
      title: "Tổng Lớp Học",
      value: data?.totalClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "#fa8c16",
      bgColor: "#fff7e6",
      iconName: "SolutionOutlined",
    },
    {
      key: "activeClasses",
      title: "Lớp Đang Hoạt Động",
      value: data?.activeClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "trạng thái Ongoing",
      color: "#52c41a",
      bgColor: "#f6ffed",
      iconName: "CheckCircleOutlined",
    },
    {
      key: "unassignedClasses",
      title: "Chưa Phân Công GV",
      value: data?.unassignedClasses ?? 0,
      trend: 0,
      trendType: "down",
      trendLabel: "cần xếp lịch",
      color: "#faad14",
      bgColor: "#fffbe6",
      iconName: "ClockCircleOutlined",
    },
    {
      key: "assignedClasses",
      title: "Đã Phân Công GV",
      value: data?.assignedClasses ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "lớp đã xếp lịch",
      color: "#eb2f96",
      bgColor: "#fff0f6",
      iconName: "CalendarOutlined",
    },
    {
      key: "totalUsers",
      title: "Tổng Tài Khoản",
      value: data?.totalUsers ?? 0,
      trend: 0,
      trendType: "up",
      trendLabel: "toàn hệ thống",
      color: "#f5222d",
      bgColor: "#fff1f0",
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
    registrationChart: [],
    aiChart: [],
    activities: [],
  };
};
