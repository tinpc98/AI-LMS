import type { ClassRecord } from "../class/class.types";
import type { AccountRecord } from "../account/account.types";
import type { CourseRecord } from "../course/course.types";

export type AssignmentStatusFilter = "All" | "Assigned" | "Unassigned";

export interface TeacherAssignmentFilters {
  search: string;
  courseId: string;
  teacherId: string;
  status: AssignmentStatusFilter;
}

export interface TeacherOption {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  teachingLoad: number;
  isAvailable: boolean;
  statusText: "Available" | "Busy";
}

export interface CourseOption {
  id: string;
  courseName: string;
  subject?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingClass?: ClassRecord;
  commonDays?: string[];
  message?: string;
}

export interface TeacherAssignmentStats {
  totalClasses: number;
  assignedCount: number;
  unassignedCount: number;
  activeTeachersCount: number;
}

export type { ClassRecord, AccountRecord, CourseRecord };
