import type { Subject } from "../subject/subject.types";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CourseLevel = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";

export interface CourseRecord {
  id: string;
  name: string;
  code: string;
  subjectId: Subject | string;
  grade: number;
  level: CourseLevel;
  description: string;
  thumbnail: string;
  pricing?: {
    tuitionFee?: number;
    [key: string]: any;
  };
  duration: {
    value: number;
    unit: string;
  };
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
  subjectId: string | "All";
  status: CourseStatus | "All";
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CourseFormValues {
  name: string;
  code: string;
  subjectId: string;
  grade: number;
  level: CourseLevel;
  description: string;
  thumbnail: string;
  pricing?: {
    tuitionFee?: number;
  };
  duration: {
    value: number;
    unit: string;
  };
  status: CourseStatus;
}
