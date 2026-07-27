import type { IAttendanceItem, AttendanceStatus } from "../interface/attendanceInterface";

export interface IExtendedAttendanceRecord extends IAttendanceItem {
  sessionTitle?: string;
  sessionTime?: string;
  teacherName?: string;
  monthKey?: string; // YYYY-MM
}

export interface StudentAttendanceFilterOptions {
  searchQuery: string;
  monthFilter: string; // "all", "2026-07", etc.
  statusFilter: "all" | AttendanceStatus;
  viewMode: "table" | "timeline";
  sortBy: "newest" | "oldest";
}

export interface StudentAttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  presentRate: number; // Percent %
  warningLevel: "none" | "low" | "critical"; // low if <80%, critical if <50%
}
