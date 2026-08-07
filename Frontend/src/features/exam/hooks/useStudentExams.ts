import { useState, useMemo, useCallback } from "react";
import type { IExam, IExamAttempt } from "../../../api/examApi";
import type {
  IExtendedExam,
  StudentExamFilterOptions,
  StudentExamStats,
  StudentExamStatus,
} from "../../../types/studentExam";

export function useStudentExams(
  initialExams: IExam[] = [],
  attemptsMap: Record<string, IExamAttempt> = {}
) {
  const [filters, setFilters] = useState<StudentExamFilterOptions>({
    searchQuery: "",
    statusFilter: "all",
    sortBy: "start_asc",
  });

  // Calculate exam statuses
  const extendedExams: IExtendedExam[] = useMemo(() => {
    const now = new Date().getTime();

    return initialExams.map((exam) => {
      const attempt = attemptsMap[exam._id] || (exam as any).attempt || null;
      let status: StudentExamStatus = "Upcoming";

      const startTime = new Date(exam.startTime).getTime();
      const oneHourBefore = startTime - 60 * 60 * 1000;
      const durationMs = (exam.duration || 45) * 60 * 1000;
      const endTime = exam.createdAt
        ? new Date(exam.startTime).getTime() + durationMs + 24 * 60 * 60 * 1000
        : startTime + durationMs;

      if (attempt) {
        if (attempt.status === "SUBMITTED" || attempt.status === "GRADED") {
          status = "Completed";
        } else if (attempt.status === "IN_PROGRESS") {
          status = "In Progress";
        }
      } else if (now < oneHourBefore) {
        status = "Upcoming";
      } else if (now >= oneHourBefore && now <= endTime) {
        status = "Available";
      } else {
        status = "Expired";
      }

      const isAvailableNow = now >= oneHourBefore && now <= endTime;
      const diffMs = startTime - now;
      const minutesRemaining = Math.max(0, Math.round(diffMs / (1000 * 60)));

      return {
        ...exam,
        attempt,
        displayStatus: status,
        isAvailableNow,
        minutesRemaining,
      };
    });
  }, [initialExams, attemptsMap]);

  // Compute stats
  const stats: StudentExamStats = useMemo(() => {
    const total = extendedExams.length;
    let available = 0;
    let inProgress = 0;
    let completed = 0;
    let totalScore = 0;
    let scoredCount = 0;

    extendedExams.forEach((item) => {
      if (item.displayStatus === "Available") available++;
      else if (item.displayStatus === "In Progress") inProgress++;
      else if (item.displayStatus === "Completed") {
        completed++;
        if (item.attempt?.totalScore !== undefined && item.attempt?.totalScore !== null) {
          totalScore += item.attempt.totalScore;
          scoredCount++;
        }
      }
    });

    const averageScore = scoredCount > 0 ? Number((totalScore / scoredCount).toFixed(1)) : null;

    return { total, available, inProgress, completed, averageScore };
  }, [extendedExams]);

  // Filter & Sort logic
  const filteredExams = useMemo(() => {
    let result = [...extendedExams];

    // Search filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || (e.description || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      const target = filters.statusFilter.toLowerCase();
      result = result.filter((e) => {
        const s = e.status.toLowerCase();
        if (target === "upcoming") return s === "upcoming";
        if (target === "available") return s === "available";
        if (target === "in_progress") return s === "in progress";
        if (target === "completed") return s === "completed";
        if (target === "expired") return s === "expired";
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();

      if (filters.sortBy === "start_asc") return timeA - timeB;
      if (filters.sortBy === "start_desc") return timeB - timeA;
      if (filters.sortBy === "newest") {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      }
      if (filters.sortBy === "name_asc") {
        return a.title.localeCompare(b.title, "vi");
      }
      return 0;
    });

    return result;
  }, [extendedExams, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: StudentExamFilterOptions["statusFilter"]) => {
      setFilters((prev) => ({ ...prev, statusFilter: value }));
    },
    []
  );

  const handleSortChange = useCallback((value: StudentExamFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    filters,
    stats,
    extendedExams,
    filteredExams,
    handleSearchChange,
    handleStatusFilterChange,
    handleSortChange,
  };
}

export default useStudentExams;
