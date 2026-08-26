import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  ComplaintRecord,
  CreateComplaintPayload,
} from "../features/complaint/complaint.types";

// Khiếu nại & tranh chấp — Backend/src/modules/complaint (EduSpace mechanism design Phần C.6).
export const complaintApi = {
  create: (payload: CreateComplaintPayload) => {
    return axiosClient.post<ApiEnvelope<ComplaintRecord>>("/complaints", payload);
  },
  // Admin: khiếu nại chưa phản hồi VÀ đã quá SLA (CHILD_SAFETY ưu tiên lên đầu).
  listOverdue: () => {
    return axiosClient.get<ApiEnvelope<ComplaintRecord[]>>("/complaints/overdue");
  },
  respond: (id: string) => {
    return axiosClient.patch<ApiEnvelope<ComplaintRecord>>(`/complaints/${id}/respond`);
  },
  resolve: (id: string, resolution: string) => {
    return axiosClient.patch<ApiEnvelope<ComplaintRecord>>(`/complaints/${id}/resolve`, {
      resolution,
    });
  },
};
