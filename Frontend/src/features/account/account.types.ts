import type { AvailabilitySchedule } from "../../interface/userInterface";

export type AccountRole = "Admin" | "Teacher" | "Student";
export type AccountStatus = "Active" | "Inactive" | "Locked" | "Expired";

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
  // Chỉ có ý nghĩa khi role === "Teacher", xem Backend/src/modules/auth/user.model.js
  teachingSubjects?: string[];
  availabilitySchedule?: AvailabilitySchedule | null;
  // Cơ chế xác minh/độ tin cậy (EduSpace mechanism design Phần A/C) — chỉ có ý nghĩa với Teacher.
  verificationTier?: "L1" | "L2" | "L3";
  reliabilityScore?: number;
  poolStatus?: "ACTIVE" | "LOCKED" | "REMOVED";
  poolLockedUntil?: string | null;
  vouchLimit?: number;
  vouchedBy?: string[];
  vouchSuspendedUntil?: string | null;
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
