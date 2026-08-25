export type SubjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: SubjectStatus;
  courseCount?: number;
  createdBy?: { _id: string; fullName: string; email: string };
  updatedBy?: { _id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface SubjectFilters {
  status?: string;
  search?: string;
  code?: string;
  page?: number;
  limit?: number;
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
