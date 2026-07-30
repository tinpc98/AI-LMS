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

export interface IGradeItemDef {
  _id: string;
  title: string;
  category: string;
  maxScore: number;
  weight: number;
  type: string;
  sourceId?: string;
}

export interface IStudentGradeData {
  student: any;
  grades: Record<string, { score: number; feedback: string; rawId?: string }>;
  avgGPA: number | null;
  totalWeight: number;
  legacyGrades?: IGrade[];
}

export interface IGradeMatrixResponse {
  gradeItems: IGradeItemDef[];
  students: IStudentGradeData[];
  weights?: any;
}

export interface StudentGPAResponse {
  classId: string;
  studentId: string;
  gpa: number | null;
  weights?: {
    attendance?: number;
    assignment?: number;
    midterm?: number;
    final?: number;
  };
  gradesCount?: number;
  detail?: IGrade[];
}

export const mapGPAResponse = (data: any): StudentGPAResponse => {
  const gpaRaw = data?.gpa;
  const gpa = (gpaRaw === null || gpaRaw === undefined) ? null : Number(gpaRaw);

  return {
    classId: data?.classId || "",
    studentId: data?.studentId || "",
    gpa: Number.isNaN(gpa) ? null : gpa,
    weights: data?.weights || undefined,
    gradesCount: data?.gradesCount || 0,
    detail: data?.detail || [],
  };
};

export const gradeApi = {
  // Lấy bảng điểm của toàn bộ lớp học (Dạng Matrix)
  getGradesByClass: async (classId: string): Promise<IGradeMatrixResponse> => {
    const response = await axiosClient.get<{ success?: boolean; data: IGradeMatrixResponse }>(`/api/grades/class/${classId}`);
    return response.data.data ?? response.data;
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

  // Lấy bảng điểm cá nhân của học sinh (Dạng Matrix)
  getGradesByStudent: async (studentId: string, classId?: string): Promise<IGradeMatrixResponse> => {
    const response = await axiosClient.get<{ success?: boolean; data: IGradeMatrixResponse }>(
      `/api/grades/student/${studentId}${classId ? `?classId=${classId}` : ""}`
    );
    return response.data.data ?? response.data;
  },

  // Lấy tổng kết GPA môn học của học sinh từ Backend API
  getStudentGPA: async (classId: string, studentId: string = "me"): Promise<StudentGPAResponse> => {
    const response = await axiosClient.get<{ success?: boolean; data: any }>(
      `/api/grades/gpa/${classId}/${studentId}`
    );
    const raw = response.data.data ?? response.data;
    return mapGPAResponse(raw);
  },
};

export default gradeApi;
