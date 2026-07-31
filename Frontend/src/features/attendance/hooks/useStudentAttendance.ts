// Bảng điểm danh của học sinh trong một lớp.
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A). Quy tắc nghiệp vụ đã tách sang
// studentAttendance.logic.ts; ở đây chỉ còn phần React.
//
// SỬA MỘT BUG THẬT: bản cũ nuốt trọn lỗi bằng `.catch((err) => console.error(...))`. Gọi API
// hỏng thì học sinh thấy bảng điểm danh TRỐNG RỖNG và không có lời giải thích nào — trông y
// hệt như "lớp chưa có buổi nào". Tệ hơn nữa là bảng thống kê vẫn hiện, với tỉ lệ chuyên cần
// 100% (vì công thức coi "chưa có buổi nào" là 100%). Tức là lỗi mạng được trình bày cho học
// sinh như một tin tốt.
//
// Giờ lỗi được trả ra ngoài để màn hình tự quyết định cách báo.
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "../../../api/attendanceApi";
import { queryKeys } from "../../../shared/api/queryKeys";
import type { StudentAttendanceFilterOptions } from "../../../types/studentAttendance";
import {
  DEFAULT_ATTENDANCE_FILTERS,
  collectMonthOptions,
  computeAttendanceStats,
  extendRecords,
  filterAndSortAttendance,
} from "../studentAttendance.logic";

const FALLBACK_ERROR = "Không thể tải dữ liệu điểm danh.";

export function useStudentAttendance(classId?: string) {
  const {
    data: rawRecords = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.class.attendance(classId),
    queryFn: async () => {
      const res = await attendanceApi.getAttendanceByStudent("me", classId!);
      return res.data.data || [];
    },
    enabled: !!classId,
  });

  const [filters, setFilters] = useState<StudentAttendanceFilterOptions>(
    DEFAULT_ATTENDANCE_FILTERS
  );

  const extendedRecords = useMemo(() => extendRecords(rawRecords), [rawRecords]);
  const stats = useMemo(() => computeAttendanceStats(extendedRecords), [extendedRecords]);
  const monthOptions = useMemo(() => collectMonthOptions(extendedRecords), [extendedRecords]);
  const filteredRecords = useMemo(
    () => filterAndSortAttendance(extendedRecords, filters),
    [extendedRecords, filters]
  );

  const updateFilter = useCallback(
    <K extends keyof StudentAttendanceFilterOptions>(
      key: K,
      value: StudentAttendanceFilterOptions[K]
    ) => setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => updateFilter("searchQuery", value),
    [updateFilter]
  );
  const handleMonthFilterChange = useCallback(
    (value: string) => updateFilter("monthFilter", value),
    [updateFilter]
  );
  const handleStatusFilterChange = useCallback(
    (value: StudentAttendanceFilterOptions["statusFilter"]) => updateFilter("statusFilter", value),
    [updateFilter]
  );
  const handleViewModeChange = useCallback(
    (value: StudentAttendanceFilterOptions["viewMode"]) => updateFilter("viewMode", value),
    [updateFilter]
  );
  const handleSortChange = useCallback(
    (value: StudentAttendanceFilterOptions["sortBy"]) => updateFilter("sortBy", value),
    [updateFilter]
  );

  const serverMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;

  return {
    loading: isLoading,
    // Mới: trước đây lỗi bị nuốt nên màn hình không có cách nào biết mà báo.
    error: error ? serverMessage || FALLBACK_ERROR : null,
    filters,
    stats,
    monthOptions,
    extendedRecords,
    filteredRecords,
    refetch,
    handleSearchChange,
    handleMonthFilterChange,
    handleStatusFilterChange,
    handleViewModeChange,
    handleSortChange,
  };
}

export default useStudentAttendance;
