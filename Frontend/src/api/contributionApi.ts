import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";

export interface TeacherContributionSummary {
  teacherId: string;
  totalHours: number;
  totalSessions: number;
  totalClasses: number;
  totalStudents: number;
  periodFrom: string | null;
  periodTo: string | null;
}

// Tổng hợp đóng góp giáo viên (giờ dạy/số buổi/số lớp/số học viên) — Backend/src/reporting/contribution.*
export const contributionApi = {
  getMy: () => {
    return axiosClient.get<ApiEnvelope<TeacherContributionSummary>>("/contribution/teachers/me");
  },
  getForTeacher: (teacherId: string) => {
    return axiosClient.get<ApiEnvelope<TeacherContributionSummary>>(
      `/contribution/teachers/${teacherId}`
    );
  },
};
