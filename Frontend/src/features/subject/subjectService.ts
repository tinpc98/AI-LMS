import axiosClient from "../../api/axiosClient";
import type { Subject, SubjectFilters, ApiResponse } from "./subject.types";

export const subjectService = {
  getSubjects: async (filters: SubjectFilters = {}) => {
    const params: Record<string, unknown> = { ...filters };
    if (params.status === "All") delete params.status;

    const res = await axiosClient.get<ApiResponse<Subject[]>>("/subjects", {
      params,
    });
    return res.data;
  },

  getSubjectById: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<Subject>>(`/subjects/${id}`);
    return res.data.data;
  },

  createSubject: async (data: Partial<Subject>) => {
    const res = await axiosClient.post<ApiResponse<Subject>>("/subjects", data);
    return res.data.data;
  },

  updateSubject: async (id: string, data: Partial<Subject>) => {
    const res = await axiosClient.patch<ApiResponse<Subject>>(`/subjects/${id}`, data);
    return res.data.data;
  },

  activateSubject: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse<Subject>>(`/subjects/${id}/activate`);
    return res.data.data;
  },

  archiveSubject: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse<Subject>>(`/subjects/${id}/archive`);
    return res.data.data;
  },
};
