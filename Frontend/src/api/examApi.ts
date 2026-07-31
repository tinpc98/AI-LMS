// Client API cho miền thi cử.
//
// ĐÃ GỠ TOÀN BỘ `any` (14 chỗ). Kiểu chuyển sang src/types/exam.ts, viết theo ĐÚNG phản hồi
// thật của backend chứ không suy từ tên biến — xem ghi chú nguồn đối chiếu trong file đó.
//
// Vì sao tầng api là chỗ đáng gỡ `any` trước: kiểu định nghĩa ở đây lan xuống mọi màn hình
// dùng nó. Gỡ `any` ở một component chỉ sửa được một chỗ; gỡ ở đây sửa cả nhánh.
import axiosClient from "./axiosClient";
import type {
  IAttemptReview,
  IAttemptStats,
  IExam,
  IExamAttempt,
  IQuestion,
  QuestionQueryParams,
} from "../types/exam";

export type { IExam, IExamAttempt } from "../types/exam";

/** Envelope chuẩn của backend. */
interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
}

export const examApi = {
  // Lấy danh sách bài kiểm tra của lớp
  getExamsByClass: async (classId: string): Promise<IExam[]> => {
    const response = await axiosClient.get<ApiEnvelope<IExam[]>>(`/api/exams/class/${classId}`);
    return response.data.data ?? [];
  },

  // Lấy chi tiết 1 bài kiểm tra
  getExamById: async (examId: string): Promise<IExam> => {
    const response = await axiosClient.get<ApiEnvelope<IExam>>(`/api/exams/${examId}`);
    return response.data.data;
  },

  // Tạo bài kiểm tra thủ công
  createExam: async (examData: Partial<IExam>): Promise<IExam> => {
    const response = await axiosClient.post<ApiEnvelope<IExam>>("/api/exams", examData);
    return response.data.data;
  },

  /**
   * Sinh bài kiểm tra tự động từ AI.
   *
   * Ma trận đề: mỗi phần tử là một yêu cầu "lấy N câu chủ đề X, độ khó Y". Trước đây tham số
   * này là `any`, nên gõ nhầm tên trường sẽ đi thẳng tới máy chủ rồi lỗi ở đó.
   */
  autoGenerateExam: async (matrixData: {
    classId: string;
    title: string;
    duration: number;
    startTime: string;
    matrix: Array<{ topic: string; difficulty?: string; count: number }>;
  }): Promise<IExam> => {
    const response = await axiosClient.post<ApiEnvelope<IExam>>(
      "/api/exams/auto-generate",
      matrixData
    );
    return response.data.data;
  },

  // Cập nhật đề thi (status: PUBLISHED / DRAFT)
  updateExam: async (examId: string, data: Partial<IExam>): Promise<IExam> => {
    const response = await axiosClient.put<ApiEnvelope<IExam>>(`/api/exams/${examId}`, data);
    return response.data.data;
  },

  /**
   * Lấy câu hỏi từ Ngân hàng câu hỏi.
   *
   * Endpoint này KHÔNG dùng envelope { success, data } như các endpoint khác — nó trả thẳng
   * { total, data }. Giữ nguyên và ghi chú thay vì "sửa cho nhất quán": đổi hình dạng phản hồi
   * là thay đổi hợp đồng API, không phải việc của tầng client.
   */
  getQuestions: async (
    params?: QuestionQueryParams
  ): Promise<{ total: number; data: IQuestion[] }> => {
    const response = await axiosClient.get<{ total: number; data: IQuestion[] }>("/api/questions", {
      params,
    });
    return response.data;
  },

  // Xóa bài kiểm tra
  deleteExam: async (examId: string): Promise<void> => {
    await axiosClient.delete(`/api/exams/${examId}`);
  },

  // Lấy danh sách lượt thi của sinh viên theo examId
  getAttemptsByExam: async (
    examId: string
  ): Promise<{ attempts: IExamAttempt[]; stats?: IAttemptStats }> => {
    const response = await axiosClient.get<ApiEnvelope<IExamAttempt[]> & { stats?: IAttemptStats }>(
      `/api/exam-attempts/exam/${examId}`
    );

    return { attempts: response.data.data ?? [], stats: response.data.stats };
  },

  /**
   * Chi tiết bài làm để giáo viên chấm tự luận.
   *
   * Trả về IAttemptReview, KHÔNG phải IExamAttempt — backend dựng riêng một payload phẳng cho
   * màn hình chấm bài (gộp câu hỏi, đáp án đúng, điểm tối đa vào cùng một mảng). Trước đây kiểu
   * trả về là `any` nên khác biệt này hoàn toàn vô hình với người đọc.
   */
  getAttemptForReview: async (attemptId: string): Promise<IAttemptReview> => {
    const response = await axiosClient.get<ApiEnvelope<IAttemptReview>>(
      `/api/exam-attempts/${attemptId}/review`
    );
    return response.data.data;
  },

  // Chấm điểm bài tự luận
  gradeEssay: async (
    attemptId: string,
    essayGrades: Array<{ questionId: string; pointsEarned: number }>
  ): Promise<IExamAttempt> => {
    const response = await axiosClient.post<ApiEnvelope<IExamAttempt>>(
      `/api/exam-attempts/${attemptId}/grade-essay`,
      { essayGrades }
    );
    return response.data.data;
  },
};

export default examApi;
