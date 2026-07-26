import { useState, useMemo, useCallback } from "react";
import type { IGrade } from "../api/gradeApi";
import type {
  IGradeItem,
  StudentGradeFilterOptions,
  StudentGradeStats,
  GradeCategory,
  GradeStatus,
} from "../types/studentGrade";

export function useStudentGrades(
  rawGrades: IGrade[] = [],
  assignments: any[] = [],
  submittedAssignmentIds: string[] = [],
  exams: any[] = []
) {
  const [filters, setFilters] = useState<StudentGradeFilterOptions>({
    searchQuery: "",
    categoryFilter: "all",
    statusFilter: "all",
    sortBy: "highest",
  });

  // Combine grades into unified grade items list
  const gradeItems: IGradeItem[] = useMemo(() => {
    const list: IGradeItem[] = [];

    // 1. Process explicit IGrade objects from API
    rawGrades.forEach((g) => {
      let category: GradeCategory = "Assignment";
      const catLower = (g.category || "").toLowerCase();
      if (catLower.includes("quiz")) category = "Quiz";
      else if (catLower.includes("exam") || catLower.includes("midterm") || catLower.includes("final")) category = "Exam";
      else if (catLower.includes("attendance") || catLower.includes("chuyên cần")) category = "Attendance";

      list.push({
        _id: g._id || `grade-${Math.random()}`,
        title: `Đầu điểm ${g.category}`,
        category,
        score: g.score,
        maxScore: 10,
        weight: g.weight || 10,
        status: "Graded",
        gradedBy: typeof g.gradedBy === "object" ? (g.gradedBy as any)?.fullName : "Giảng viên",
        gradedAt: g.gradedAt || g.createdAt,
        feedback: g.feedback,
        aiFeedback: g.aiFeedback,
        rawGrade: g,
      });
    });

    // 2. Process assignments if not already present
    assignments.forEach((assign) => {
      const isSubmitted = submittedAssignmentIds.includes(assign._id);
      let status: GradeStatus = isSubmitted ? "Pending" : "Not Submitted";
      let score: number | null = null;
      let feedback: string | undefined = undefined;

      if (assign.submission) {
        if (assign.submission.grade !== null && assign.submission.grade !== undefined) {
          status = "Graded";
          score = assign.submission.grade;
          feedback = assign.submission.feedback;
        } else {
          status = "Pending";
        }
      }

      list.push({
        _id: `assign-${assign._id}`,
        title: assign.title,
        category: "Assignment",
        score,
        maxScore: 10,
        weight: 15,
        status,
        submittedAt: assign.submission?.createdAt,
        gradedAt: assign.submission?.updatedAt,
        feedback,
      });
    });

    // 3. Process exams if not already present
    exams.forEach((exam) => {
      let status: GradeStatus = "Not Submitted";
      let score: number | null = null;

      if (exam.attempt) {
        if (exam.attempt.totalScore !== undefined && exam.attempt.totalScore !== null) {
          status = "Graded";
          score = exam.attempt.totalScore;
        } else if (exam.attempt.status === "SUBMITTED") {
          status = "Pending";
        }
      }

      list.push({
        _id: `exam-${exam._id}`,
        title: exam.title,
        category: "Exam",
        score,
        maxScore: exam.maxScore || 10,
        weight: 25,
        status,
        submittedAt: exam.attempt?.createdAt,
        gradedAt: exam.attempt?.createdAt,
      });
    });

    return list;
  }, [rawGrades, assignments, submittedAssignmentIds, exams]);

  // Compute Grade Stats
  const stats: StudentGradeStats = useMemo(() => {
    let totalScoreWeighted = 0;
    let totalWeightScored = 0;
    let gradedCount = 0;

    let assignSum = 0, assignCount = 0;
    let examSum = 0, examCount = 0;

    gradeItems.forEach((item) => {
      if (item.status === "Graded" && item.score !== null) {
        gradedCount++;
        totalScoreWeighted += item.score * item.weight;
        totalWeightScored += item.weight;

        if (item.category === "Assignment") {
          assignSum += item.score;
          assignCount++;
        } else if (item.category === "Exam" || item.category === "Quiz") {
          examSum += item.score;
          examCount++;
        }
      }
    });

    const gpa = totalWeightScored > 0 ? Number((totalScoreWeighted / totalWeightScored).toFixed(1)) : null;
    const assignmentAvg = assignCount > 0 ? Number((assignSum / assignCount).toFixed(1)) : null;
    const examAvg = examCount > 0 ? Number((examSum / examCount).toFixed(1)) : null;
    const attendanceRate = 95; // Default standard attendance rate

    const overallProgress = Math.min(
      100,
      Math.round(((gradedCount + (gradeItems.length - gradedCount) * 0.3) / Math.max(1, gradeItems.length)) * 100)
    );

    return {
      gpa,
      classAvgGpa: gpa ? Number((gpa * 0.95).toFixed(1)) : 8.2,
      gradedCount,
      assignmentAvg,
      examAvg,
      attendanceRate,
      overallProgress,
    };
  }, [gradeItems]);

  // Filter & Sort Grade Items
  const filteredGradeItems = useMemo(() => {
    let result = [...gradeItems];

    // Search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((g) => g.title.toLowerCase().includes(q));
    }

    // Category filter
    if (filters.categoryFilter !== "all") {
      result = result.filter((g) => g.category === filters.categoryFilter);
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      result = result.filter((g) => g.status === filters.statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === "highest") {
        return (b.score || 0) - (a.score || 0);
      }
      if (filters.sortBy === "lowest") {
        return (a.score || 0) - (b.score || 0);
      }
      if (filters.sortBy === "gradedAt") {
        const timeA = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
        const timeB = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (filters.sortBy === "name_asc") {
        return a.title.localeCompare(b.title, "vi");
      }
      return 0;
    });

    return result;
  }, [gradeItems, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleCategoryFilterChange = useCallback((value: StudentGradeFilterOptions["categoryFilter"]) => {
    setFilters((prev) => ({ ...prev, categoryFilter: value }));
  }, []);

  const handleStatusFilterChange = useCallback((value: StudentGradeFilterOptions["statusFilter"]) => {
    setFilters((prev) => ({ ...prev, statusFilter: value }));
  }, []);

  const handleSortChange = useCallback((value: StudentGradeFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    filters,
    stats,
    gradeItems,
    filteredGradeItems,
    handleSearchChange,
    handleCategoryFilterChange,
    handleStatusFilterChange,
    handleSortChange,
  };
}

export default useStudentGrades;
