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
  createdAt: string;
  updatedAt: string;
}

export interface AccountFilters {
  search: string;
  role: AccountRole | "All";
  status: AccountStatus | "All";
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
