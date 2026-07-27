import type { IAssignment, ISubmission } from "../interface/assignmentInterface";

export type StudentAssignmentStatus = "Pending" | "Submitted" | "Late" | "Graded" | "Missing";

export interface IExtendedAssignment extends IAssignment {
  submission?: ISubmission | null;
  status: StudentAssignmentStatus;
  isOverdue?: boolean;
  hoursRemaining?: number;
}

export interface StudentAssignmentFilterOptions {
  searchQuery: string;
  statusFilter: "all" | "pending" | "submitted" | "late" | "graded";
  sortBy: "deadline_asc" | "deadline_desc" | "newest" | "name_asc";
}

export interface StudentAssignmentStats {
  total: number;
  pending: number;
  submitted: number;
  late: number;
  graded: number;
  averageGrade: number | null;
}
