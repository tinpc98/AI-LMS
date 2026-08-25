export type StudentClassStatus =
  "Ready" | "Active" | "Completed" | "Paused" | "active" | "completed" | "closed";

export interface ITeacherSummary {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: string;
}

export interface IStudentClass {
  _id: string;
  name: string;
  code?: string;
  joinCode?: string;
  subject?: string;
  courseName?: string;
  semester?: string;
  teacher?: ITeacherSummary | null;
  totalStudents?: number;
  capacity?: number;
  // 0 - 100, hoặc null khi lớp chưa có bài giảng/bài tập nào để tính tiến độ.
  // null KHÁC 0: null nghĩa là "chưa xác định được", 0 nghĩa là "chưa học gì".
  progress?: number | null;
  status: StudentClassStatus;
  startDate?: string;
  endDate?: string;
  isLiveActive?: boolean;
  mode?: "OFFLINE" | "ONLINE";
  description?: string;
  schedule?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
  };
  createdAt?: string;
}

export interface StudentClassFilterOptions {
  search: string;
  status: string; // 'ALL' | 'Active' | 'Completed' | 'Paused' | 'Ready'
  semester: string; // 'ALL' | 'HK1' | 'HK2' | 'HK3'
  subject: string; // 'ALL' | specific subject
  sortBy: "name_asc" | "name_desc" | "date_asc" | "date_desc";
}
