import axiosClient from "../../api/axiosClient";
import type {
  EnrollmentRecord,
  EnrollmentFilters,
  EnrollmentApiResponse,
  EnrollmentStatus,
} from "./enrollment.types";

export const enrollmentService = {
  /**
   * Student: tạo enrollment cho chính mình.
   */
  async createEnrollment({
    courseId,
    level,
  }: {
    courseId: string;
    level: string;
  }): Promise<EnrollmentRecord> {
    const res = await axiosClient.post<EnrollmentApiResponse<EnrollmentRecord>>("/enrollments", {
      courseId,
      level,
    });
    return res.data.data!;
  },

  /**
   * Student: lấy enrollment của chính mình.
   */
  async getMyEnrollments(
    filters: EnrollmentFilters = {}
  ): Promise<EnrollmentApiResponse<EnrollmentRecord[]>> {
    const params: Record<string, unknown> = { ...filters };
    if (params.status === "All") delete params.status;

    const res = await axiosClient.get<EnrollmentApiResponse<EnrollmentRecord[]>>(
      "/enrollments/me",
      { params }
    );
    return res.data;
  },

  /**
   * Admin: lấy tất cả enrollments.
   */
  async getAllEnrollments(
    filters: EnrollmentFilters = {}
  ): Promise<EnrollmentApiResponse<EnrollmentRecord[]>> {
    const params: Record<string, unknown> = { ...filters };
    if (params.status === "All") delete params.status;

    const res = await axiosClient.get<EnrollmentApiResponse<EnrollmentRecord[]>>("/enrollments", {
      params,
    });
    return res.data;
  },

  /**
   * Lấy enrollment theo ID.
   */
  async getEnrollmentById(id: string): Promise<EnrollmentRecord> {
    const res = await axiosClient.get<EnrollmentApiResponse<EnrollmentRecord>>(
      `/enrollments/${id}`
    );
    return res.data.data!;
  },

  /**
   * Admin: lấy enrollments đang chờ xếp lớp.
   */
  async getAdminPendingClass(
    filters: EnrollmentFilters = {}
  ): Promise<EnrollmentApiResponse<EnrollmentRecord[]>> {
    const res = await axiosClient.get<EnrollmentApiResponse<EnrollmentRecord[]>>(
      "/enrollments/admin/pending-class",
      { params: filters }
    );
    return res.data;
  },

  /**
   * Admin: chuyển trạng thái enrollment.
   */
  async transitionStatus(
    id: string,
    action: "approve" | "complete" | "cancel"
  ): Promise<EnrollmentRecord> {
    const res = await axiosClient.patch<EnrollmentApiResponse<EnrollmentRecord>>(
      `/enrollments/${id}/${action}`
    );
    return res.data.data!;
  },

  /**
   * Student: hủy enrollment PENDING_PAYMENT của chính mình.
   */
  async cancelMyEnrollment(id: string): Promise<EnrollmentRecord> {
    return this.transitionStatus(id, "cancel");
  },

  /**
   * Admin: tạo enrollment cho student.
   */
  async createEnrollmentByAdmin(studentId: string, courseId: string): Promise<EnrollmentRecord> {
    const res = await axiosClient.post<EnrollmentApiResponse<EnrollmentRecord>>(
      "/enrollments/admin",
      { studentId, courseId }
    );
    return res.data.data!;
  },

  /**
   * Admin: xếp lớp cho enrollment
   */
  async assignClass(id: string, classId: string): Promise<EnrollmentRecord> {
    const res = await axiosClient.post<EnrollmentApiResponse<EnrollmentRecord>>(
      `/enrollments/${id}/assign-class`,
      { classId }
    );
    return res.data.data!;
  },
};
