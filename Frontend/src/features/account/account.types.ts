export type AccountRole = "Admin" | "Teacher" | "Student";
export type AccountStatus = "Active" | "Inactive" | "Locked";

export interface AccountRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AccountRole;
  status: AccountStatus;
  avatar?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountFilters {
  search: string;
  role: AccountRole | "All";
  status: AccountStatus | "All";
  page?: number;
  limit?: number;
}

export interface AccountFormValues {
  fullName: string;
  email: string;
  phone: string;
  role: AccountRole;
  status: AccountStatus;
  password?: string;
  confirmPassword?: string;
  avatar?: string;
}

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
}
