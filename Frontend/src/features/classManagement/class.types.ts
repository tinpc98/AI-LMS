export type ClassLearningMode = "Offline" | "Online" | "Hybrid";
export type ClassStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";

export interface ClassRecord {
  id: string;
  className: string;
  classCode: string;
  courseId: string;
  teacherId?: string | null;
  joinCode: string;
  classroom: string;
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
  students: string[];
  description: string;
  note: string;
  isEnrollmentOpen: boolean;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFilters {
  search: string;
  courseId: string;
  learningMode: ClassLearningMode | "All";
  status: ClassStatus | "All";
}

export interface ClassFormValues {
  className: string;
  classCode: string;
  courseId: string;
  teacherId: string;
  joinCode: string;
  classroom: string;
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
