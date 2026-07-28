export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
  errors?: any;
}

export type ClassLearningMode = "Offline" | "Online" | "Hybrid";
export type ClassStatus =
  | "Draft"
  | "Ready"
  | "Ongoing"
  | "Completed"
  | "Cancelled"
  | "Archived";

export interface ClassRecord {
  id: string; // Mapped from _id
  className: string;
  classCode: string;
  courseId: string;
  teacherId?: string | null;
  assignedBy?: string | null;
  joinCode?: string;
  classRoom: string;
  meetingRoomId?: string;
  googleMeetLink?: string;
  learningMode: ClassLearningMode;
  startDate: string;
  endDate: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  maxStudents: number;
  currentStudents: number;
  students: any[];
  description: string;
  note: string;
  isEnrollmentOpen: boolean;
  status: ClassStatus;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFilters {
  search: string;
  courseId: string;
  learningMode: ClassLearningMode | "All";
  status: ClassStatus | "All";
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "ascend" | "descend";
}

export interface ClassFormValues {
  className: string;
  classCode: string;
  courseId: string;
  teacherId?: string;
  joinCode?: string;
  classRoom: string;
  learningMode: ClassLearningMode;
  startDate: string;
  endDate: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  maxStudents: number;
  description: string;
  note: string;
  isEnrollmentOpen: boolean;
  status: ClassStatus;
}

export interface CourseOption {
  id: string;
  label: string;
}

export interface TeacherOption {
  id: string;
  label: string;
}
