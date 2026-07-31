import axiosClient from "./axiosClient";
import { unwrap, type ApiEnvelope } from "./unwrap";
import type { UserSummary } from "../types/exam";

export interface IExamSet {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  ownerId?: string | UserSummary;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const examSetApi = {
  // Lấy danh sách bộ đề thi
  getExamSets: async (params?: {
    search?: string;
    status?: string;
    folderId?: string;
    page?: number;
    limit?: number;
  }): Promise<IExamSet[]> => {
    const response = await axiosClient.get<ApiEnvelope<IExamSet[]>>("/api/exam-sets", { params });
    return unwrap(response.data, []);
  },

  // Lấy chi tiết bộ đề thi theo ID
  getExamSetById: async (id: string): Promise<IExamSet> => {
    const response = await axiosClient.get<ApiEnvelope<IExamSet>>(`/api/exam-sets/${id}`);
    return unwrap(response.data, {} as IExamSet);
  },

  // Nhân bản bộ đề thi
  duplicateExamSet: async (examSetId: string): Promise<IExamSet> => {
    const response = await axiosClient.post<ApiEnvelope<IExamSet>>(
      `/api/exam-sets/${examSetId}/duplicate`
    );
    return unwrap(response.data, {} as IExamSet);
  },
};

export default examSetApi;
