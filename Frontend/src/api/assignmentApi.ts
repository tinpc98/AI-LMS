import type { IAssignment, ISubmission } from "../interface/assignmentInterface";
import axiosClient from "./axiosClient";
import { getApiErrorCode, getApiErrorStatus } from "../shared/utils/apiError";

interface SubmissionEnvelope {
  success?: boolean;
  message?: string;
  submission?: ISubmission;
  data: ISubmission;
}

interface IAssignmentListResponse {
  assignments: IAssignment[];
}

interface IAssignmentCreateResponse {
  message: string;
  assignment: IAssignment;
}

const assignmentApi = {
  // Lấy danh sách bài tập của lớp
  getAssignmentsByClass: async (classId: string): Promise<IAssignment[]> => {
    const response = await axiosClient.get<IAssignmentListResponse>(
      `/api/assignments/class/${classId}`
    );
    return response.data.assignments ?? [];
  },

  // Lấy chi tiết 1 bài tập
  getAssignmentById: async (id: string): Promise<IAssignment> => {
    const response = await axiosClient.get<{ assignment: IAssignment }>(`/api/assignments/${id}`);
    return response.data.assignment;
  },

  // Tạo bài tập mới (multipart/form-data)
  createAssignment: async (formData: FormData): Promise<IAssignment> => {
    const response = await axiosClient.post<IAssignmentCreateResponse>(
      "/api/assignments",
      formData
    );
    return response.data.assignment;
  },

  // Cập nhật bài tập (multipart/form-data)
  updateAssignment: async (id: string, formData: FormData): Promise<IAssignment> => {
    const response = await axiosClient.put<{ assignment: IAssignment }>(
      `/api/assignments/${id}`,
      formData
    );
    return response.data.assignment;
  },

  // Xóa bài tập
  deleteAssignment: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/assignments/${id}`);
  },

  // Giáo viên xem danh sách bài nộp của bài tập
  getSubmissionsByAssignment: async (assignmentId: string): Promise<ISubmission[]> => {
    const response = await axiosClient.get<{ submissions: ISubmission[] }>(
      `/api/assignments/submissions/${assignmentId}`
    );
    return response.data.submissions ?? [];
  },

  // Giáo viên chấm điểm bài nộp
  gradeSubmission: async (
    submissionId: string,
    data: { grade: number; feedback?: string; aiFeedback?: string }
  ): Promise<ISubmission> => {
    const response = await axiosClient.put<{ submission: ISubmission }>(
      `/api/assignments/grade/${submissionId}`,
      data
    );
    return response.data.submission;
  },

  // Xem chi tiết 1 bài nộp cụ thể (đã được xác thực quyền)
  getSubmissionById: async (submissionId: string): Promise<ISubmission | null> => {
    try {
      const response = await axiosClient.get<SubmissionEnvelope>(
        `/api/assignments/submissions/detail/${submissionId}`
      );
      return response.data.submission ?? response.data.data ?? null;
    } catch {
      return null;
    }
  },

  // Học sinh xem bài nộp cá nhân
  getMySubmission: async (assignmentId: string): Promise<ISubmission | null> => {
    try {
      const response = await axiosClient.get<SubmissionEnvelope>(
        `/api/assignments/${assignmentId}/my-submission`
      );
      return response.data.submission ?? response.data.data ?? null;
    } catch (err: unknown) {
      const code = getApiErrorCode(err);
      if (code === "SUBMISSION_NOT_FOUND" || getApiErrorStatus(err) === 404) return null;
      return null;
    }
  },

  // Học sinh lưu bản nháp (Draft)
  saveDraft: async (
    assignmentId: string,
    data: {
      submissionType?: string;
      content?: string;
      linkUrl?: string;
      answers?: Array<{ questionId: string; content: string }>;
    }
  ): Promise<ISubmission> => {
    const response = await axiosClient.post<SubmissionEnvelope>(
      `/api/assignments/draft/${assignmentId}`,
      data
    );
    return response.data.submission ?? response.data.data;
  },

  // Học sinh nộp bài / nộp lại bài
  submitAssignment: async (assignmentId: string, formData: FormData): Promise<ISubmission> => {
    const response = await axiosClient.post<SubmissionEnvelope>(
      `/api/assignments/submit/${assignmentId}`,
      formData
    );
    return response.data.submission ?? response.data.data;
  },

  // Học sinh hủy nộp bài
  cancelSubmission: async (assignmentId: string): Promise<ISubmission> => {
    const response = await axiosClient.delete<SubmissionEnvelope>(
      `/api/assignments/submit/${assignmentId}`
    );
    return response.data.submission ?? response.data.data;
  },
};

export default assignmentApi;
