import { useState, useEffect, useCallback, useMemo } from "react";
import studentClassApi from "../api/studentClassApi";
import type { IStudentClass, StudentClassFilterOptions } from "../types/studentClass";

export function useStudentClasses() {
  const [classes, setClasses] = useState<IStudentClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<StudentClassFilterOptions>({
    search: "",
    status: "ALL",
    semester: "ALL",
    subject: "ALL",
    sortBy: "name_asc",
  });

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentClassApi.fetchMyClasses();
      setClasses(data);
    } catch (err: any) {
      console.error("🚨 Error loading student classes:", err);
      setError(err?.response?.data?.message || "Không thể tải danh sách lớp học!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Extract unique subjects and semesters for select options
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    return Array.from(set);
  }, [classes]);

  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.semester) set.add(c.semester);
    });
    return Array.from(set);
  }, [classes]);

  // Filter & Sort logic
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // 1. Search by Class Name, Class Code, or Subject
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.className.toLowerCase().includes(q) ||
          (c.classCode && c.classCode.toLowerCase().includes(q)) ||
          (c.subject && c.subject.toLowerCase().includes(q))
      );
    }

    // 2. Filter Status
    if (filters.status !== "ALL") {
      result = result.filter((c) => c.status === filters.status);
    }

    // 3. Filter Semester
    if (filters.semester !== "ALL") {
      result = result.filter((c) => c.semester === filters.semester);
    }

    // 4. Filter Subject
    if (filters.subject !== "ALL") {
      result = result.filter((c) => c.subject === filters.subject);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "name_asc") {
        return a.className.localeCompare(b.className, "vi");
      }
      if (filters.sortBy === "name_desc") {
        return b.className.localeCompare(a.className, "vi");
      }
      if (filters.sortBy === "date_asc") {
        return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
      }
      if (filters.sortBy === "date_desc") {
        return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [classes, filters]);

  // Handler functions
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setSemesterFilter = useCallback((semester: string) => {
    setFilters((prev) => ({ ...prev, semester }));
  }, []);

  const setSubjectFilter = useCallback((subject: string) => {
    setFilters((prev) => ({ ...prev, subject }));
  }, []);

  const setSortBy = useCallback((sortBy: StudentClassFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "ALL",
      semester: "ALL",
      subject: "ALL",
      sortBy: "name_asc",
    });
  }, []);

  return {
    classes,
    filteredClasses,
    loading,
    error,
    filters,
    availableSubjects,
    availableSemesters,
    setSearch,
    setStatusFilter,
    setSemesterFilter,
    setSubjectFilter,
    setSortBy,
    resetFilters,
    refetch: loadClasses,
  };
}

export default useStudentClasses;
