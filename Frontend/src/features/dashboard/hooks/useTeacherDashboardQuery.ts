// File: src/features/dashboard/hooks/useTeacherDashboardQuery.ts
// Thay thế cụm useState + useEffect + fetchDashboardData thủ công ở HomePageTeacher.tsx
// bằng React Query (Wave 1.2 — sửa lỗi cascading render BC13 #2).
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherDashboard } from "../teacherDashboard.service";
import { dashboardQueryKeys } from "../dashboard.queryKeys";

export const useTeacherDashboardQuery = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dashboardQueryKeys.teacher,
    queryFn: fetchTeacherDashboard,
  });

  const classes = data?.classes ?? [];

  const totalStudentsCount = classes.reduce((sum: number, c: any) => {
    const studentCount = c.currentStudents ?? (Array.isArray(c.students) ? c.students.length : 0);
    return sum + studentCount;
  }, 0);

  return {
    classes,
    announcements: data?.announcements ?? [],
    assignments: data?.assignments ?? [],
    activeLiveSessions: data?.activeLiveSessions ?? [],
    totalStudentsCount,
    loading: isLoading,
    error: error ? (error as Error).message || "Lỗi khi tải dữ liệu từ máy chủ. Vui lòng thử lại!" : null,
    refetch,
  };
};

export default useTeacherDashboardQuery;
