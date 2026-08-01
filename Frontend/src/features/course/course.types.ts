export type CourseSubject = "Mathematics" | "Physics" | "Chemistry" | "English" | "Literature";
export type CourseStatus = "Draft" | "Published" | "Closed";

export interface CourseRecord {
  id: string;
  courseName: string;
  subject: CourseSubject;
  grade: number;
  description: string;
  thumbnail: string;
  tuitionFee: number;
  durationWeeks: number;
  totalLessons: number;
  target: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface CourseFilters {
  search: string;
  subject: CourseSubject | "All";
  status: CourseStatus | "All";
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CourseFormValues {
  courseName: string;
  subject: CourseSubject;
  grade: number;
  description: string;
  thumbnail: string;
  tuitionFee: number;
  durationWeeks: number;
  totalLessons: number;
  target: string;
  status: CourseStatus;
}
