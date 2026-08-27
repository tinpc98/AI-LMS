import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  CreateLearnerNeedPayload,
  LearnerNeedRecord,
} from "../features/learner-need/learnerNeed.types";

// Ghi nhận & xem nhu cầu học tập của chính học viên — Backend/src/modules/learnerNeed.
export const learnerNeedApi = {
  createMy: (payload: CreateLearnerNeedPayload) => {
    return axiosClient.post<ApiEnvelope<LearnerNeedRecord>>("/learner-needs/my", payload);
  },
  getMy: () => {
    return axiosClient.get<ApiEnvelope<LearnerNeedRecord[]>>("/learner-needs/my");
  },
  cancelMy: (id: string) => {
    return axiosClient.patch<ApiEnvelope<LearnerNeedRecord>>(`/learner-needs/my/${id}/cancel`);
  },
  // Admin/giáo viên xem để xếp lớp thủ công (MVP — chưa có matching tự động).
  list: (params?: { subject?: string; status?: string }) => {
    return axiosClient.get<ApiEnvelope<LearnerNeedRecord[]>>("/learner-needs", { params });
  },
  updateStatus: (id: string, status: LearnerNeedRecord["status"]) => {
    return axiosClient.patch<ApiEnvelope<LearnerNeedRecord>>(`/learner-needs/${id}/status`, {
      status,
    });
  },
};
