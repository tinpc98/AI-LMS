import axiosClient from "./axiosClient";
import { unwrapOrNull, type ApiEnvelope } from "./unwrap";

export interface IStudentAnalytics {
  progress: {
    averageProgress: number;
    totalLearningTime: number;
    completedLessons: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  assignment: {
    completed: number;
    averageScore: number;
  };
  trend: { date: string; activities: number }[];
}

export interface ITeacherAnalytics {
  overview: {
    totalStudents: number;
    classAvgProgress: number;
    attendanceRate: number;
    assignmentAvgScore: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  lowProgressStudents: {
    studentId: string;
    fullName: string;
    email: string;
    avgProgress: number;
  }[];
}

const analyticsApi = {
  getStudentDashboard: async (classId: string): Promise<IStudentAnalytics | null> => {
    const response = await axiosClient.get<ApiEnvelope<IStudentAnalytics>>(
      `/api/analytics/student/dashboard/${classId}`
    );
    return unwrapOrNull(response.data);
  },
  getTeacherDashboard: async (classId: string): Promise<ITeacherAnalytics | null> => {
    const response = await axiosClient.get<ApiEnvelope<ITeacherAnalytics>>(
      `/api/analytics/teacher/dashboard/${classId}`
    );
    return unwrapOrNull(response.data);
  },
  getTeacherExportUrl: (classId: string) => {
    // Generate full URL for direct download
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${baseURL}/analytics/teacher/export/${classId}`;
  },
};

export default analyticsApi;
