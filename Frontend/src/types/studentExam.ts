import type { IExam, IExamAttempt } from "../api/examApi";

export type StudentExamStatus = "Upcoming" | "Available" | "In Progress" | "Completed" | "Expired";

export interface IExtendedExam extends IExam {
  attempt?: IExamAttempt | null;
  status: StudentExamStatus;
  isAvailableNow?: boolean;
  minutesRemaining?: number;
}

export interface StudentExamFilterOptions {
  searchQuery: string;
  statusFilter: "all" | "upcoming" | "available" | "in_progress" | "completed" | "expired";
  sortBy: "start_asc" | "start_desc" | "newest" | "name_asc";
}

export interface StudentExamStats {
  total: number;
  available: number;
  inProgress: number;
  completed: number;
  averageScore: number | null;
}
