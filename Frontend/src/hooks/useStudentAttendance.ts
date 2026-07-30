import { useState, useMemo, useCallback, useEffect } from "react";
import { attendanceApi } from "../api/attendanceApi";
import type { IAttendanceItem, AttendanceStatus } from "../interface/attendanceInterface";
import type {
  IExtendedAttendanceRecord,
  StudentAttendanceFilterOptions,
  StudentAttendanceStats,
} from "../types/studentAttendance";

export function useStudentAttendance(classId?: string) {
  const [rawRecords, setRawRecords] = useState<IAttendanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<StudentAttendanceFilterOptions>({
    searchQuery: "",
    monthFilter: "all",
    statusFilter: "all",
    viewMode: "table",
    sortBy: "newest",
  });

  useEffect(() => {
    if (classId) {
      setLoading(true);
      attendanceApi.getAttendanceByStudent("me", classId)
        .then((res) => {
          setRawRecords(res.data || []);
        })
        .catch((err) => console.error("Fetch student attendance error:", err))
        .finally(() => setLoading(false));
    }
  }, [classId]);

  // Enrich records with formatted session title, time, teacher name
  const extendedRecords: IExtendedAttendanceRecord[] = useMemo(() => {
    return rawRecords.map((rec, idx) => {
      const dateObj = rec.date ? new Date(rec.date) : new Date();
      const dateStr = dateObj.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      const teacherName =
        typeof rec.teacherId === "object" && (rec.teacherId as any)?.fullName
          ? (rec.teacherId as any).fullName
          : "Giảng viên";

      return {
        ...rec,
        sessionTitle: `Buổi học ngày ${dateStr}`,
        sessionTime: "08:00 - 10:30",
        teacherName,
        monthKey,
      };
    });
  }, [rawRecords]);

  // Compute Stats & Warnings
  const stats: StudentAttendanceStats = useMemo(() => {
    const total = extendedRecords.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    extendedRecords.forEach((item) => {
      if (item.status === "Present") present++;
      else if (item.status === "Late") late++;
      else if (item.status === "Absent") absent++;
      else if (item.status === "Excused") excused++;
    });

    const attendedWeighted = present + late * 0.7 + excused * 0.9;
    const presentRate = total > 0 ? Math.round((attendedWeighted / total) * 100) : 100;

    let warningLevel: StudentAttendanceStats["warningLevel"] = "none";
    if (presentRate < 50) warningLevel = "critical";
    else if (presentRate < 80) warningLevel = "low";

    return {
      total,
      present,
      late,
      absent,
      excused,
      presentRate,
      warningLevel,
    };
  }, [extendedRecords]);

  // Extract unique month options for filter dropdown
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    extendedRecords.forEach((rec) => {
      if (rec.monthKey) monthsSet.add(rec.monthKey);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [extendedRecords]);

  // Filter & Sort records
  const filteredRecords = useMemo(() => {
    let result = [...extendedRecords];

    // Search filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (rec) =>
          (rec.sessionTitle || "").toLowerCase().includes(q) ||
          (rec.note || "").toLowerCase().includes(q) ||
          (rec.date || "").includes(q)
      );
    }

    // Month filter
    if (filters.monthFilter !== "all") {
      result = result.filter((rec) => rec.monthKey === filters.monthFilter);
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      result = result.filter((rec) => rec.status === filters.statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();

      if (filters.sortBy === "newest") return timeB - timeA;
      if (filters.sortBy === "oldest") return timeA - timeB;
      return 0;
    });

    return result;
  }, [extendedRecords, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleMonthFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, monthFilter: value }));
  }, []);

  const handleStatusFilterChange = useCallback((value: StudentAttendanceFilterOptions["statusFilter"]) => {
    setFilters((prev) => ({ ...prev, statusFilter: value }));
  }, []);

  const handleViewModeChange = useCallback((value: StudentAttendanceFilterOptions["viewMode"]) => {
    setFilters((prev) => ({ ...prev, viewMode: value }));
  }, []);

  const handleSortChange = useCallback((value: StudentAttendanceFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    loading,
    filters,
    stats,
    monthOptions,
    extendedRecords,
    filteredRecords,
    handleSearchChange,
    handleMonthFilterChange,
    handleStatusFilterChange,
    handleViewModeChange,
    handleSortChange,
  };
}

export default useStudentAttendance;
