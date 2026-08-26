import type {
  IAssignment,
  IAssignmentAttempt,
  IAttemptAnswer,
} from "../interface/assignmentInterface";
import axiosClient from "./axiosClient";

interface IAssignmentCreatePayload {
  topicId: string;
  title: string;
  description?: string;
  instructions?: any[];
  questions: Array<{ questionId: string; order: number; points: number }>;
  status: "DRAFT" | "PUBLISHED";
  /** TÍNH NĂNG MỚI: thời gian làm bài (phút), bắt buộc — mirror IExamCreatePayload.duration. */
  duration: number;
  startAt?: string | null;
  endAt?: string | null;
}

const assignmentApi = {
  // Lấy danh sách bài tập của lớp (Không hỗ trợ trong BE hiện tại, giả định gọi qua course/topic API hoặc cần cập nhật)
  // Tạm thời giữ mock hoặc fetch topic
  getAssignmentsByClass: async (classId: string): Promise<IAssignment[]> => {
    return [];
  },

  // Tạo bài tập mới
  createAssignment: async (payload: IAssignmentCreatePayload): Promise<IAssignment> => {
    const response = await axiosClient.post<{ message: string; assignment: IAssignment }>(
      "/assignments",
      payload
    );
    return response.data.assignment;
  },

  // Publish bài tập
  publishAssignment: async (id: string): Promise<IAssignment> => {
    const response = await axiosClient.patch<{ message: string; assignment: IAssignment }>(
      `/assignments/${id}/publish`
    );
    return response.data.assignment;
  },

  // Lấy chi tiết bài tập
  getAssignmentById: async (id: string): Promise<IAssignment> => {
    const response = await axiosClient.get<{ assignment: IAssignment }>(`/assignments/${id}`);
    return response.data.assignment;
  },

  // Start attempt (Học sinh)
  startAttempt: async (assignmentId: string): Promise<IAssignmentAttempt> => {
    const response = await axiosClient.post<{ message: string; attempt: IAssignmentAttempt }>(
      `/assignments/${assignmentId}/attempts`
    );
    return response.data.attempt;
  },

  // Lấy history attempts của học sinh
  getAttemptHistory: async (assignmentId: string): Promise<IAssignmentAttempt[]> => {
    const response = await axiosClient.get<{ attempts: IAssignmentAttempt[] }>(
      `/assignments/${assignmentId}/attempts`
    );
    return response.data.attempts ?? [];
  },

  // Lấy chi tiết attempt
  getAttemptById: async (attemptId: string): Promise<IAssignmentAttempt> => {
    const response = await axiosClient.get<{ attempt: IAssignmentAttempt }>(
      `/assignments/attempts/${attemptId}`
    );
    return response.data.attempt;
  },

  // Lưu câu trả lời (Học sinh)
  saveAnswer: async (
    attemptId: string,
    questionId: string,
    answer: IAttemptAnswer
  ): Promise<IAssignmentAttempt> => {
    const response = await axiosClient.patch<{ message: string; attempt: IAssignmentAttempt }>(
      `/assignments/attempts/${attemptId}/questions/${questionId}`,
      answer
    );
    return response.data.attempt;
  },

  // Nộp bài (Học sinh)
  submitAttempt: async (attemptId: string): Promise<IAssignmentAttempt> => {
    const response = await axiosClient.post<{ message: string; attempt: IAssignmentAttempt }>(
      `/assignments/attempts/${attemptId}/submit`
    );
    return response.data.attempt;
  },

  // Lấy danh sách attempts cho giáo viên
  getAttemptsForTeacher: async (assignmentId: string): Promise<IAssignmentAttempt[]> => {
    const response = await axiosClient.get<{ attempts: IAssignmentAttempt[] }>(
      `/assignments/${assignmentId}/teacher-attempts`
    );
    return response.data.attempts ?? [];
  },

  // Giáo viên chấm điểm essay
  gradeEssay: async (
    attemptId: string,
    questionId: string,
    score: number,
    feedback?: string
  ): Promise<IAssignmentAttempt> => {
    const response = await axiosClient.patch<{ message: string; attempt: IAssignmentAttempt }>(
      `/assignments/attempts/${attemptId}/questions/${questionId}/grade`,
      { score, feedback }
    );
    return response.data.attempt;
  },
};

export default assignmentApi;
