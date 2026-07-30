import axiosClient from "./axiosClient";
import type {
  IAttendancePayload,
  IAttendanceItem,
  IAttendanceStats,
  IVirtualSession,
  IAttendanceMatrix,
} from "../interface/attendanceInterface";

export const attendanceApi = {
  // Điểm danh hàng loạt / lưu điểm danh cho 1 lớp vào 1 ngày
  markAttendance: (payload: IAttendancePayload) =>
    axiosClient.post<{ message: string; data: IAttendanceItem[] }>("/api/attendances", payload),

  // Cập nhật 1 bản ghi điểm danh
  updateAttendance: (id: string, data: { status?: string; note?: string }) =>
    axiosClient.put<{ message: string; data: IAttendanceItem }>(`/api/attendances/${id}`, data),

  // Lấy danh sách buổi học ảo
  getClassSessions: (classId: string) =>
    axiosClient.get<{ message: string; data: IVirtualSession[] }>(`/api/attendances/class/${classId}/sessions`),

  // Lấy ma trận điểm danh của lớp
  getAttendanceMatrix: (classId: string) =>
    axiosClient.get<{ message: string; data: IAttendanceMatrix }>(`/api/attendances/class/${classId}/matrix`),

  // Lấy danh sách điểm danh theo lớp (và ngày nếu có)
  getAttendanceByClass: (classId: string, date?: string) => {
    const params = date ? { date } : {};
    return axiosClient.get<{ message: string; data: IAttendanceItem[] }>(`/api/attendances/class/${classId}`, { params });
  },

  // Lấy lịch sử điểm danh của học sinh
  getAttendanceByStudent: (studentId: string, classId?: string) => {
    const params = classId ? { classId } : {};
    return axiosClient.get<{ message: string; data: IAttendanceItem[] }>(`/api/attendances/student/${studentId}`, { params });
  },

  // Lấy thống kê tỷ lệ điểm danh theo lớp
  getAttendanceStats: (classId: string) =>
    axiosClient.get<{ message: string; data: IAttendanceStats }>(`/api/attendances/stats/class/${classId}`),
};
