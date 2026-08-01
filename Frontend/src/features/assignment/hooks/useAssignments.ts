import { useState, useMemo, useCallback } from "react";
import type { IAssignment, ISubmission } from "../../../interface/assignmentInterface";
import type {
  IExtendedAssignment,
  StudentAssignmentFilterOptions,
  StudentAssignmentStats,
  StudentAssignmentStatus,
} from "../../../types/studentAssignment";

export function useAssignments(
  initialAssignments: IAssignment[] = [],
  submittedIds: string[] = [],
  submissionsMap: Record<string, ISubmission> = {}
) {
  const [filters, setFilters] = useState<StudentAssignmentFilterOptions>({
    searchQuery: "",
    statusFilter: "all",
    sortBy: "deadline_asc",
  });

  // Transform raw assignments to extended assignments with statuses
  const extendedAssignments: IExtendedAssignment[] = useMemo(() => {
    const now = new Date().getTime();

    return initialAssignments.map((assignment) => {
      const submission = submissionsMap[assignment._id] || null;
      const isSubmitted = submittedIds.includes(assignment._id) || Boolean(submission);

      let status: StudentAssignmentStatus = "Pending";
      const deadlineTime = new Date(assignment.deadline).getTime();
      const isOverdue = now > deadlineTime;

      if (submission) {
        if (submission.grade !== null && submission.grade !== undefined) {
          status = "Graded";
        } else if (submission.status === "late") {
          status = "Late";
        } else {
          status = "Submitted";
        }
      } else if (isSubmitted) {
        status = "Submitted";
      } else if (isOverdue) {
        status = "Missing";
      } else {
        status = "Pending";
      }

      const diffMs = deadlineTime - now;
      const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

      return {
        ...assignment,
        submission,
        status,
        isOverdue,
        hoursRemaining,
      };
    });
  }, [initialAssignments, submittedIds, submissionsMap]);

  // Compute stats
  const stats: StudentAssignmentStats = useMemo(() => {
    const total = extendedAssignments.length;
    let pending = 0;
    let submitted = 0;
    let late = 0;
    let graded = 0;
    let totalGrade = 0;
    let gradedCount = 0;

    extendedAssignments.forEach((item) => {
      if (item.status === "Pending") pending++;
      else if (item.status === "Submitted") submitted++;
      else if (item.status === "Late" || item.status === "Missing") late++;
      else if (item.status === "Graded") {
        graded++;
        if (item.submission?.grade !== null && item.submission?.grade !== undefined) {
          totalGrade += item.submission.grade;
          gradedCount++;
        }
      }
    });

    const averageGrade = gradedCount > 0 ? Number((totalGrade / gradedCount).toFixed(1)) : null;

    return { total, pending, submitted, late, graded, averageGrade };
  }, [extendedAssignments]);

  // Filter & Sort assignments
  const filteredAssignments = useMemo(() => {
    let result = [...extendedAssignments];

    // Search filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      const target = filters.statusFilter.toLowerCase();
      result = result.filter((a) => {
        const s = a.status.toLowerCase();
        if (target === "pending") return s === "pending";
        if (target === "submitted") return s === "submitted";
        if (target === "late") return s === "late" || s === "missing";
        if (target === "graded") return s === "graded";
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();

      if (filters.sortBy === "deadline_asc") return timeA - timeB;
      if (filters.sortBy === "deadline_desc") return timeB - timeA;
      if (filters.sortBy === "newest") {
        const createdA = new Date(a.createdAt).getTime();
        const createdB = new Date(b.createdAt).getTime();
        return createdB - createdA;
      }
      if (filters.sortBy === "name_asc") {
        return a.title.localeCompare(b.title, "vi");
      }
      return 0;
    });

    return result;
  }, [extendedAssignments, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: StudentAssignmentFilterOptions["statusFilter"]) => {
      setFilters((prev) => ({ ...prev, statusFilter: value }));
    },
    []
  );

  const handleSortChange = useCallback((value: StudentAssignmentFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    filters,
    stats,
    extendedAssignments,
    filteredAssignments,
    handleSearchChange,
    handleStatusFilterChange,
    handleSortChange,
  };
}

export default useAssignments;
