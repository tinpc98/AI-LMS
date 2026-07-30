import axiosClient from "./axiosClient";

export interface IExamSet {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  ownerId?: any;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const examSetApi = {
  // Lấy danh sách bộ đề thi
  getExamSets: async (params?: any): Promise<IExamSet[]> => {
    const response = await axiosClient.get<{ success?: boolean; data: IExamSet[] }>("/api/exam-sets", { params });
    return (response.data as any).data ?? response.data ?? [];
  },

  // Lấy chi tiết bộ đề thi theo ID
  getExamSetById: async (id: string): Promise<IExamSet> => {
    const response = await axiosClient.get<{ success?: boolean; data: IExamSet }>(`/api/exam-sets/${id}`);
    return (response.data as any).data ?? response.data;
  },

  // Nhân bản bộ đề thi
  duplicateExamSet: async (examSetId: string): Promise<IExamSet> => {
    const response = await axiosClient.post<{ success?: boolean; data: IExamSet }>(
      `/api/exam-sets/${examSetId}/duplicate`
    );
    return (response.data as any).data ?? response.data;
  },
};

export default examSetApi;
