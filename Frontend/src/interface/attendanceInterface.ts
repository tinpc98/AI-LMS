export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export interface IStudentAttendanceRecord {
  studentId: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  status: AttendanceStatus;
  note?: string;
}

export interface IAttendancePayload {
  classId: string;
  date: string; // YYYY-MM-DD
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string;
  }>;
}

export interface IAttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  presentRate?: number | string;
}

export interface IAttendanceItem {
  _id: string;
  classId: string | any;
  teacherId: string | any;
  studentId:
    | {
        _id: string;
        fullName?: string;
        email?: string;
        avatar?: string;
      }
    | string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  createdAt?: string;
}

export type SessionStatus = "Upcoming" | "Open" | "Saved" | "Closed" | "Cancelled";

export interface IVirtualSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  hasRecords: boolean;
  stats: IAttendanceStats;
}

export interface IAttendanceMatrix {
  sessions: IVirtualSession[];
  students: Array<{
    _id: string;
    fullName: string;
    studentCode?: string;
    email?: string;
    avatar?: string;
  }>;
  records: Record<string, Record<string, IAttendanceItem>>;
}
