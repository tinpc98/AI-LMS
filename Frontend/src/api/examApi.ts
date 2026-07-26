import axiosClient from "./axiosClient";

export interface IExam {
  _id: string;
  title: string;
  duration: number; // phút
  startTime: string;
  classId: string;
  createdBy?: any;
  isAIGenerated?: boolean;
  aiPromptUsed?: string;
  maxScore?: number;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | string;
  questions?: any[];
  createdAt?: string;
}

export interface IExamAttempt {
  _id: string;
  examId: any;
  studentId: any;
  status: "IN_PROGRESS" | "SUBMITTED" | "PARTIALLY_GRADED" | "GRADED" | string;
  answers?: any[];
  totalScore?: number;
  startTime?: string;
  endTime?: string;
  cheatCount?: number;
  cheatWarnings?: number;
  createdAt?: string;
}

export const examApi = {
  // Lấy danh sách bài kiểm tra của lớp
  getExamsByClass: async (classId: string): Promise<IExam[]> => {
    const response = await axiosClient.get<{ success?: boolean; data: IExam[] }>(`/api/exams/class/${classId}`);
    return response.data.data ?? response.data ?? [];
  },

  // Lấy chi tiết 1 bài kiểm tra
  getExamById: async (examId: string): Promise<IExam> => {
    const response = await axiosClient.get<{ data: IExam }>(`/api/exams/${examId}`);
    return response.data.data;
  },

  // Tạo bài kiểm tra thủ công
  createExam: async (examData: Partial<IExam>): Promise<IExam> => {
    const response = await axiosClient.post<{ data: IExam }>("/api/exams", examData);
    return response.data.data;
  },

  // Sinh bài kiểm tra tự động từ AI
  autoGenerateExam: async (matrixData: any): Promise<IExam> => {
    const response = await axiosClient.post<{ data: IExam }>("/api/exams/auto-generate", matrixData);
    return response.data.data;
  },

  // Cập nhật đề thi (status: PUBLISHED / DRAFT)
  updateExam: async (examId: string, data: Partial<IExam>): Promise<IExam> => {
    const response = await axiosClient.put<{ data: IExam }>(`/api/exams/${examId}`, data);
    return response.data.data;
  },

  // Lấy câu hỏi từ Ngân hàng câu hỏi
  getQuestions: async (params?: any): Promise<{ total: number; data: any[] }> => {
    const response = await axiosClient.get<{ total: number; data: any[] }>("/api/questions", { params });
    return response.data;
  },

  // Xóa bài kiểm tra
  deleteExam: async (examId: string): Promise<void> => {
    await axiosClient.delete(`/api/exams/${examId}`);
  },

  // Lấy danh sách lượt thi của sinh viên theo examId
  getAttemptsByExam: async (examId: string): Promise<{ attempts: IExamAttempt[]; stats?: any }> => {
    const response = await axiosClient.get<{ success?: boolean; data: IExamAttempt[]; stats?: any }>(
      `/api/exam-attempts/exam/${examId}`
    );
    return {
      attempts: response.data.data ?? [],
      stats: response.data.stats,
    };
  },

  // Lấy chi tiết bài làm thi để Giáo viên review & chấm tự luận
  getAttemptForReview: async (attemptId: string): Promise<any> => {
    const response = await axiosClient.get<{ success?: boolean; data: any }>(
      `/api/exam-attempts/${attemptId}/review`
    );
    return response.data.data;
  },

  // Chấm điểm bài tự luận
  gradeEssay: async (
    attemptId: string,
    essayGrades: Array<{ questionId: string; pointsEarned: number }>
  ): Promise<IExamAttempt> => {
    const response = await axiosClient.post<{ data: IExamAttempt }>(
      `/api/exam-attempts/${attemptId}/grade-essay`,
      { essayGrades }
    );
    return response.data.data;
  },
};

export default examApi;
