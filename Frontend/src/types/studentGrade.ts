import type { IGrade } from "../api/gradeApi";

export type GradeCategory = "Assignment" | "Quiz" | "Exam" | "Attendance" | "Final" | "Other";

export type GradeStatus = "Graded" | "Pending" | "Not Submitted" | "Missing" | "Excused";

export interface IGradeItem {
  _id: string;
  title: string;
  category: GradeCategory;
  score: number | null;
  maxScore: number;
  weight: number; // Trọng số %
  status: GradeStatus;
  gradedBy?: string;
  gradedAt?: string;
  submittedAt?: string;
  feedback?: string;
  aiFeedback?: string;
  rawGrade?: IGrade;
}

export interface StudentGradeFilterOptions {
  searchQuery: string;
  categoryFilter: "all" | "Assignment" | "Quiz" | "Exam" | "Attendance";
  statusFilter: "all" | "Graded" | "Pending";
  sortBy: "highest" | "lowest" | "gradedAt" | "name_asc";
}

export interface StudentGradeStats {
  gpa: number | null;
  classAvgGpa: number | null;
  gradedCount: number;
  assignmentAvg: number | null;
  examAvg: number | null;
  attendanceRate: number | null; // Percent % — null nếu chưa có API tính chuyên cần thật
  overallProgress: number; // Percent %
}
