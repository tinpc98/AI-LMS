import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  CoTaughtColleague,
  L3Eligibility,
  MyVerificationStatus,
  VouchResult,
} from "../features/verification/verification.types";

export interface SuspendVouchersResult {
  suspendedVoucherIds: string[];
  suspendUntil?: string;
}

// Xác minh 3 tầng & bảo lãnh chéo — Backend/src/modules/auth/verification.routes.js (EduSpace
// mechanism design Phần C.1/C.2).
export const verificationApi = {
  getMyStatus: () => axiosClient.get<ApiEnvelope<MyVerificationStatus>>("/verification/me"),
  getMyCoTaughtColleagues: () =>
    axiosClient.get<ApiEnvelope<CoTaughtColleague[]>>("/verification/me/co-taught-colleagues"),
  vouchForTeacher: (voucheeId: string) =>
    axiosClient.post<ApiEnvelope<VouchResult>>("/verification/vouch", { voucheeId }),

  // Admin — xem/can thiệp xác minh của MỘT giáo viên bất kỳ.
  getL3EligibilityFor: (teacherId: string) =>
    axiosClient.get<ApiEnvelope<L3Eligibility>>(`/verification/${teacherId}/l3-eligibility`),
  promoteTeacherToL3: (teacherId: string) =>
    axiosClient.post<ApiEnvelope<{ promoted: boolean }>>(`/verification/${teacherId}/promote-l3`),
  suspendTeacherVouchers: (teacherId: string) =>
    axiosClient.post<ApiEnvelope<SuspendVouchersResult>>(
      `/verification/${teacherId}/suspend-vouchers`
    ),
};

export default verificationApi;
