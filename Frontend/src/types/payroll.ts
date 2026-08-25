// ============================================================
// PAYROLL TYPES — Source of Truth: Backend payroll models
// ============================================================

// ——— PayrollPeriod ———————————————————————————————————————————

export type PayrollPeriodStatus =
  | "OPEN"
  | "CALCULATED"
  | "CONFIRMED"
  | "PAID"
  | "LOCKED";

export interface IPayrollPeriod {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ——— Payroll ———————————————————————————————————————————————

export type PayrollStatus =
  | "DRAFT"
  | "CALCULATED"
  | "CONFIRMED"
  | "PAID"
  | "LOCKED";

export type PayrollCalculationType = "PER_SESSION" | "PER_COURSE";

/** Sub-document — no _id per schema (_id: false) */
export interface IPayrollItem {
  sessionId?: string | null;
  courseId?: string | null;
  classId?: string | null;
  description: string;
  calculationType: PayrollCalculationType;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

/** Populated teacher ref (used in getAllPayrolls) */
export interface IPayrollTeacherRef {
  _id: string;
  fullName?: string;
  email?: string;
}

export interface IPayroll {
  _id: string;
  /** ObjectId or populated teacher object */
  teacherId: string | IPayrollTeacherRef;
  /** ObjectId or populated period object */
  payrollPeriodId: string | IPayrollPeriod;
  baseAmount: number;
  sessionCount: number;
  courseCount: number;
  totalAmount: number;
  status: PayrollStatus;
  items: IPayrollItem[];
  calculatedAt?: string | null;
  calculatedBy?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  paidAt?: string | null;
  paidBy?: string | null;
  lockedAt?: string | null;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ——— PayrollConfig ————————————————————————————————————————

export type PayrollConfigType = "PER_SESSION" | "PER_COURSE";

export type PayrollConfigStatus = "ACTIVE" | "INACTIVE";

export interface IPayrollConfig {
  _id: string;
  /** ObjectId or populated teacher object */
  teacherId: string | IPayrollTeacherRef;
  type: PayrollConfigType;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: PayrollConfigStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ——— API Payloads —————————————————————————————————————————

export interface CreatePayrollPeriodPayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreatePayrollConfigPayload {
  teacherId: string;
  type: PayrollConfigType;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: PayrollConfigStatus;
}

// ——— API Responses ————————————————————————————————————————

/**
 * CRITICAL: GET /payrolls/my and GET /payrolls use spread response.
 * Controller: res.json({ success: true, ...result })
 * Result = { items, pagination }
 * => Final shape: { success, items, pagination } — NO "data" wrapper.
 */
export interface PayrollListResponse {
  success: boolean;
  message?: string;
  items: IPayroll[];
  pagination: PayrollPagination;
}

export interface PayrollPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PayrollPeriodListResponse {
  success: boolean;
  message?: string;
  /** Array returned directly under "data" key */
  data: IPayrollPeriod[];
}

export interface PayrollPeriodResponse {
  success: boolean;
  message?: string;
  data: IPayrollPeriod;
}

export interface PayrollResponse {
  success: boolean;
  message?: string;
  data: IPayroll;
}

export interface PayrollConfigListResponse {
  success: boolean;
  message?: string;
  data: IPayrollConfig[];
}

export interface PayrollConfigResponse {
  success: boolean;
  message?: string;
  data: IPayrollConfig;
}

export interface PayrollCalculateResponse {
  success: boolean;
  message: string;
  // No "data" returned — must refetch payroll list after calculate
}

// ——— Query Params —————————————————————————————————————————

export interface PayrollQueryParams {
  payrollPeriodId?: string;
  status?: PayrollStatus;
  page?: number;
  limit?: number;
}

export interface MyPayrollQueryParams {
  page?: number;
  limit?: number;
}
