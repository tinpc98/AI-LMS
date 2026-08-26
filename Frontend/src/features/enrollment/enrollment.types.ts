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
  duration?: { value: number; unit: string };
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
  // BUG ĐÃ SỬA: level/price là field THẬT trên Enrollment (chốt lúc đăng ký, xem
  // enrollment.model.js) — đây là nguồn đúng để hiển thị, không phải suy ra từ Course đã join
  // (Course không có 1 "level"/giá cố định, mà có 3 mức giá theo level).
  level: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  price: number;
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
