import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  CohortFeedbackRecord,
  SubmitCohortFeedbackPayload,
  TeacherAverageRatings,
} from "../features/cohort-feedback/cohortFeedback.types";

// Đánh giá học viên sau khi lớp kết thúc — Backend/src/modules/feedback (EduSpace mechanism
// design Phần C.3).
export const cohortFeedbackApi = {
  submit: (classId: string, payload: SubmitCohortFeedbackPayload) => {
    return axiosClient.post<ApiEnvelope<CohortFeedbackRecord>>(
      `/cohort-feedback/classes/${classId}`,
      payload
    );
  },
  // Giáo viên xem điểm trung bình của CHÍNH MÌNH — ẩn danh (không thấy ai đánh giá gì).
  getMyAverage: () => {
    return axiosClient.get<ApiEnvelope<TeacherAverageRatings>>("/cohort-feedback/me/average");
  },
  // Admin xem chi tiết từng đánh giá (kèm studentId) của MỘT giáo viên bất kỳ.
  getTeacherDetailsForAdmin: (teacherId: string) => {
    return axiosClient.get<ApiEnvelope<CohortFeedbackRecord[]>>(
      `/cohort-feedback/teachers/${teacherId}/details`
    );
  },
};
