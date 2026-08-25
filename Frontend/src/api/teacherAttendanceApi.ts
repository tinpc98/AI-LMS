import axiosClient from "./axiosClient";
import type {
  TeacherAttendanceQueryParams,
  TeacherAttendanceListResponse,
  TeacherAttendanceResponse,
} from "../types/teacherAttendance";

export const teacherAttendanceApi = {
  getMyAttendance: async (
    params?: TeacherAttendanceQueryParams
  ): Promise<TeacherAttendanceListResponse> => {
    const response = await axiosClient.get(
      "/teacher-attendance/my",
      { params }
    );

    return response.data;
  },

  confirmAttendance: async (
    attendanceId: string
  ): Promise<TeacherAttendanceResponse> => {
    const response = await axiosClient.post(
      `/teacher-attendance/${attendanceId}/confirm`
    );

    return response.data;
  },
};