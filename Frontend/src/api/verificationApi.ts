import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  CoTaughtColleague,
  MyVerificationStatus,
  VouchResult,
} from "../features/verification/verification.types";

// Xác minh 3 tầng & bảo lãnh chéo — Backend/src/modules/auth/verification.routes.js (EduSpace
// mechanism design Phần C.1/C.2).
export const verificationApi = {
  getMyStatus: () => axiosClient.get<ApiEnvelope<MyVerificationStatus>>("/verification/me"),
  getMyCoTaughtColleagues: () =>
    axiosClient.get<ApiEnvelope<CoTaughtColleague[]>>("/verification/me/co-taught-colleagues"),
  vouchForTeacher: (voucheeId: string) =>
    axiosClient.post<ApiEnvelope<VouchResult>>("/verification/vouch", { voucheeId }),
};

export default verificationApi;
