import axiosClient from "./axiosClient";

export interface IGrade {
  _id?: string;
  studentId: any;
  classId: string;
  courseId?: string;
  category: "Attendance" | "Assignment" | "Midterm" | "Final" | "Other" | string;
  score: number;
  weight?: number;
  gradedBy?: any;
  gradedAt?: string;
  feedback?: string;
  aiFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const gradeApi = {
  // Lấy bảng điểm của toàn bộ lớp học
  getGradesByClass: async (classId: string): Promise<IGrade[]> => {
    const response = await axiosClient.get<{ success?: boolean; data: IGrade[] }>(`/api/grades/class/${classId}`);
    return response.data.data ?? response.data ?? [];
  },

  // Tạo hoặc Cập nhật điểm cho 1 học sinh theo cột điểm
  upsertGrade: async (data: {
    studentId: string;
    classId: string;
    courseId?: string;
    category: string;
    score: number;
    weight?: number;
    feedback?: string;
    aiFeedback?: string;
  }): Promise<IGrade> => {
    const response = await axiosClient.post<{ success?: boolean; data: IGrade }>("/api/grades", data);
    return response.data.data ?? response.data;
  },

  // Lấy bảng điểm cá nhân của học sinh
  getGradesByStudent: async (studentId: string, classId?: string): Promise<IGrade[]> => {
    const response = await axiosClient.get<{ success?: boolean; data: IGrade[] }>(
      `/api/grades/student/${studentId}${classId ? `?classId=${classId}` : ""}`
    );
    return response.data.data ?? response.data ?? [];
  },

  // Lấy tổng kết GPA môn học của học sinh
  getStudentGPA: async (classId: string, studentId: string): Promise<any> => {
    const response = await axiosClient.get<{ success?: boolean; data: any }>(
      `/api/grades/gpa/${classId}/${studentId}`
    );
    return response.data.data ?? response.data;
  },
};

export default gradeApi;
