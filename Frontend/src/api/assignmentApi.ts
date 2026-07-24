import type { IAssignment } from "../interface/assignmentInterface";
import axiosClient from "./axiosClient";

interface IAssignmentListResponse {
  assignments: IAssignment[];
}

interface IAssignmentCreateResponse {
  message: string;
  assignment: IAssignment;
}

const assignmentApi = {
  getAssignmentsByClass: async (classId: string): Promise<IAssignment[]> => {
    const response = await axiosClient.get<IAssignmentListResponse>(`/api/assignments/class/${classId}`);
    return response.data.assignments ?? [];
  },

  createAssignment: async (formData: FormData): Promise<IAssignment> => {
    const response = await axiosClient.post<IAssignmentCreateResponse>("/api/assignments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.assignment;
  },

  submitAssignment: async (assignmentId: string, formData: FormData): Promise<any> => {
    return axiosClient.post(`/api/assignments/submit/${assignmentId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  cancelSubmission: async (assignmentId: string): Promise<any> => {
    return axiosClient.delete(`/api/assignments/submit/${assignmentId}`);
  },

  getSubmissionsByAssignment: async (assignmentId: string): Promise<any[]> => {
    const response = await axiosClient.get(`/api/assignments/submissions/${assignmentId}`);
    return response.data.submissions ?? [];
  },
};

export default assignmentApi;
