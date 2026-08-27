import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";
import type {
  ClassCommitmentInfo,
  EscalateLevel1Result,
  FlaggedCohort,
  OverdueSession,
  ReadinessResult,
} from "../features/cohort-mechanism/cohortMechanism.types";

// Cơ chế cam kết & leo thang — Backend/src/modules/class/cohortMechanism.routes.js (EduSpace
// mechanism design Phần A/B). Toàn bộ endpoint đều Admin-only.
export const cohortMechanismApi = {
  searchClasses: (search: string) =>
    axiosClient.get<ApiEnvelope<ClassCommitmentInfo[]>>("/classes", {
      params: { search, limit: 10 },
    }),
  getClassById: (classId: string) =>
    axiosClient.get<ApiEnvelope<ClassCommitmentInfo>>(`/classes/${classId}`),
  getReadiness: (classId: string) =>
    axiosClient.get<ApiEnvelope<ReadinessResult>>(`/cohort-mechanism/${classId}/readiness`),
  transitionCommitment: (
    classId: string,
    payload: { toStatus: string; reason?: string; note?: string }
  ) =>
    axiosClient.post<ApiEnvelope<ClassCommitmentInfo>>(
      `/cohort-mechanism/${classId}/commitment/transition`,
      payload
    ),
  assignBackupTeacher: (classId: string, backupTeacherId: string) =>
    axiosClient.post<ApiEnvelope<ClassCommitmentInfo>>(
      `/cohort-mechanism/${classId}/backup-teacher`,
      { backupTeacherId }
    ),
  activateBackupTeacher: (classId: string, reason?: string) =>
    axiosClient.post<ApiEnvelope<unknown>>(`/cohort-mechanism/${classId}/backup-teacher/activate`, {
      reason,
    }),
  listOverdueSessions: () =>
    axiosClient.get<ApiEnvelope<OverdueSession[]>>("/cohort-mechanism/sessions/overdue"),
  listFlaggedCohorts: () =>
    axiosClient.get<ApiEnvelope<FlaggedCohort[]>>("/cohort-mechanism/cohorts/flagged-for-review"),
  escalateLevel1: (sessionId: string) =>
    axiosClient.post<ApiEnvelope<EscalateLevel1Result>>(
      `/cohort-mechanism/sessions/${sessionId}/escalate-level1`
    ),
  cancelWithMakeup: (
    sessionId: string,
    payload: { makeupScheduledStartAt: string; makeupScheduledEndAt: string }
  ) =>
    axiosClient.post<ApiEnvelope<unknown>>(
      `/cohort-mechanism/sessions/${sessionId}/cancel-with-makeup`,
      payload
    ),
};

export default cohortMechanismApi;
