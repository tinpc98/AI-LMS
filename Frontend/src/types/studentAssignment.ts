import type { IAssignment, IAssignmentAttempt } from "../interface/assignmentInterface";

export type StudentAssignmentStatus = "Pending" | "In_Progress" | "Submitted" | "Graded";

export interface IExtendedAssignment extends Omit<IAssignment, "status"> {
  attempt?: IAssignmentAttempt | null;
  status: StudentAssignmentStatus;
}

export interface StudentAssignmentFilterOptions {
  searchQuery: string;
  statusFilter: "all" | "pending" | "in_progress" | "submitted" | "graded";
  sortBy: "newest" | "name_asc";
}

export interface StudentAssignmentStats {
  total: number;
  pending: number;
  in_progress: number;
  submitted: number;
  graded: number;
  averageGrade: number | null;
}
