import type { IAssignment, ISubmission } from "../interface/assignmentInterface";
import axiosClient from "./axiosClient";

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
    const response = await axiosClient.get<IAssignmentListResponse>(`/api/assignments/class/${classId}`);
    return response.data.assignments ?? [];
  },

  // Lấy chi tiết 1 bài tập
  getAssignmentById: async (id: string): Promise<IAssignment> => {
    const response = await axiosClient.get<{ assignment: IAssignment }>(`/api/assignments/${id}`);
    return response.data.assignment;
  },

  // Tạo bài tập mới (multipart/form-data)
  createAssignment: async (formData: FormData): Promise<IAssignment> => {
    const response = await axiosClient.post<IAssignmentCreateResponse>("/api/assignments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.assignment;
  },

  // Cập nhật bài tập (multipart/form-data)
  updateAssignment: async (id: string, formData: FormData): Promise<IAssignment> => {
    const response = await axiosClient.put<{ assignment: IAssignment }>(`/api/assignments/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.assignment;
  },

  // Xóa bài tập
  deleteAssignment: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/assignments/${id}`);
  },

  // Giáo viên xem danh sách bài nộp của bài tập
  getSubmissionsByAssignment: async (assignmentId: string): Promise<ISubmission[]> => {
    const response = await axiosClient.get<{ submissions: ISubmission[] }>(`/api/assignments/submissions/${assignmentId}`);
    return response.data.submissions ?? [];
  },

  // Giáo viên chấm điểm bài nộp
  gradeSubmission: async (
    submissionId: string,
    data: { grade: number; feedback?: string; aiFeedback?: string }
  ): Promise<ISubmission> => {
    const response = await axiosClient.put<{ submission: ISubmission }>(`/api/assignments/grade/${submissionId}`, data);
    return response.data.submission;
  },

  // Học sinh xem bài nộp cá nhân
  getMySubmission: async (assignmentId: string): Promise<ISubmission | null> => {
    try {
      const response = await axiosClient.get<{ submission: ISubmission }>(`/api/assignments/my-submission/${assignmentId}`);
      return (response.data as any).submission ?? (response.data as any).data ?? null;
    } catch {
      return null;
    }
  },

  // Học sinh nộp bài / nộp lại bài
  submitAssignment: async (assignmentId: string, formData: FormData): Promise<any> => {
    return axiosClient.post(`/api/assignments/submit/${assignmentId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Học sinh hủy nộp bài
  cancelSubmission: async (assignmentId: string): Promise<any> => {
    return axiosClient.delete(`/api/assignments/submit/${assignmentId}`);
  },
};

export default assignmentApi;
