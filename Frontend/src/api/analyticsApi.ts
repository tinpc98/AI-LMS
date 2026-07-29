import axiosClient from "./axiosClient";

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
  getStudentDashboard: (classId: string) => {
    return axiosClient.get<IStudentAnalytics>(`/api/analytics/student/dashboard/${classId}`);
  },
  getTeacherDashboard: (classId: string) => {
    return axiosClient.get<ITeacherAnalytics>(`/api/analytics/teacher/dashboard/${classId}`);
  },
  getTeacherExportUrl: (classId: string) => {
    // Generate full URL for direct download
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return `${baseURL}/analytics/teacher/export/${classId}`;
  },
};

export default analyticsApi;
