// ── Enrollment Status ────────────────────────────────────────────────────────

export type EnrollmentStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_PENDING_CONFIRMATION"
  | "APPROVED"
  | "CLASS_ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

// ── Enrollment Record (API response) ─────────────────────────────────────────

export interface EnrollmentCourse {
  _id: string;
  name: string;
  code: string;
  subject: string;
  grade: number;
  level: string;
  duration?: { value: number; unit: string };
  pricing?: { tuitionFee: number };
  status: string;
}

export interface EnrollmentStudent {
  _id: string;
  fullName: string;
  email: string;
}

export interface EnrollmentRecord {
  _id: string;
  studentId: string | EnrollmentStudent;
  courseId: string | EnrollmentCourse;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Filters ──────────────────────────────────────────────────────────────────

export interface EnrollmentFilters {
  status?: string;
  studentId?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}

// ── API Response ─────────────────────────────────────────────────────────────

export interface EnrollmentApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
