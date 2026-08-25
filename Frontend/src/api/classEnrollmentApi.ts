import axiosClient from "./axiosClient";

export interface ClassEnrollmentRecord {
  _id: string;
  enrollmentId: any;
  studentId: any;
  classId: any;
  status: "ACTIVE" | "TRANSFERRED" | "COMPLETED" | "CANCELLED";
  joinedAt: string;
  leftAt: string | null;
  transferredFrom: string | null;
  transferredTo: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollmentApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const classEnrollmentApi = {
  // Student
  getMyClassEnrollments: (params?: any) => 
    axiosClient.get<ClassEnrollmentApiResponse<ClassEnrollmentRecord[]>>("/class-enrollments/my", { params }),

  // Admin
  getClassEnrollments: (params?: any) => 
    axiosClient.get<ClassEnrollmentApiResponse<ClassEnrollmentRecord[]>>("/class-enrollments", { params }),

  transferClass: (id: string, targetClassId: string) => 
    axiosClient.patch<ClassEnrollmentApiResponse<ClassEnrollmentRecord>>(`/class-enrollments/${id}/transfer`, { targetClassId }),

  completeClassEnrollment: (id: string) => 
    axiosClient.patch<ClassEnrollmentApiResponse<ClassEnrollmentRecord>>(`/class-enrollments/${id}/complete`),

  cancelClassEnrollment: (id: string) => 
    axiosClient.patch<ClassEnrollmentApiResponse<ClassEnrollmentRecord>>(`/class-enrollments/${id}/cancel`),
};
