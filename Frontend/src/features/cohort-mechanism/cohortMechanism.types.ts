// Cơ chế cam kết & leo thang (EduSpace mechanism design Phần A/B) — Admin-only.
export type CommitmentStatus =
  | "OFFERED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "COMPLETED_PARTIAL"
  | "WITHDRAWN_EARLY"
  | "WITHDRAWN_MIDWAY"
  | "TERMINATED";

// Bản sao CHÍNH XÁC của ALLOWED_TRANSITIONS trong Backend/src/modules/class/commitment.service.js
// — chỉ dùng để tô màu/gợi ý UI, quyết định cuối cùng vẫn do Backend kiểm lại.
export const ALLOWED_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  OFFERED: ["ACCEPTED"],
  ACCEPTED: ["CONFIRMED", "WITHDRAWN_EARLY"],
  CONFIRMED: ["ACTIVE"],
  ACTIVE: ["COMPLETED", "COMPLETED_PARTIAL", "WITHDRAWN_MIDWAY", "TERMINATED"],
  COMPLETED: [],
  COMPLETED_PARTIAL: [],
  WITHDRAWN_EARLY: [],
  WITHDRAWN_MIDWAY: [],
  TERMINATED: [],
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  OFFERED: "Đã đề nghị",
  ACCEPTED: "Đã nhận lời",
  CONFIRMED: "Đã chốt lịch",
  ACTIVE: "Đang dạy",
  COMPLETED: "Hoàn thành",
  COMPLETED_PARTIAL: "Hoàn thành (đóng sớm)",
  WITHDRAWN_EARLY: "Rút trước khi chốt",
  WITHDRAWN_MIDWAY: "Rút giữa chừng",
  TERMINATED: "Bị chấm dứt",
};

export const COMMITMENT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  OFFERED: "default",
  ACCEPTED: "processing",
  CONFIRMED: "cyan",
  ACTIVE: "blue",
  COMPLETED: "success",
  COMPLETED_PARTIAL: "success",
  WITHDRAWN_EARLY: "warning",
  WITHDRAWN_MIDWAY: "warning",
  TERMINATED: "error",
};

// Bản sao của COMMITMENT_REASONS trong Backend/src/modules/class/commitmentEvent.model.js.
export const COMMITMENT_REASON_LABELS: Record<string, string> = {
  SCHEDULE_FILLED: "Đủ học viên + lịch chốt",
  SESSION_COMPLETED: "Một buổi học hoàn thành bình thường",
  COHORT_COMPLETED: "Hoàn thành trọn vẹn số buổi cam kết",
  WITHDREW_BEFORE_LOCK: "Rút trước khi chốt lịch",
  CANCELLED_WITH_NOTICE: "Huỷ có báo trước ≥48h",
  CANCELLED_LATE: "Huỷ trễ (<24h trước buổi)",
  NO_SHOW: "Không xuất hiện, không báo trước",
  FORCE_MAJEURE_EXCUSED: "Bất khả kháng (Admin đã duyệt miễn strike)",
  ESCALATION_TERMINATED: "Bị gỡ theo quy trình leo thang",
  COHORT_CLOSED_EARLY_HIGH_PROGRESS: "Đóng sớm nhưng đã trôi ≥70% buổi",
  COHORT_CLOSED_EARLY_LOW_PROGRESS: "Đóng sớm khi mới trôi <30% buổi",
  BACKUP_ACTIVATED: "Giáo viên dự bị được kích hoạt dạy thay",
};

export interface ClassCommitmentInfo {
  _id: string;
  name: string;
  code?: string;
  commitmentStatus: CommitmentStatus;
  cohortSessionCount?: number | null;
  fundingType?: string;
  teacherId?: string | { _id: string; fullName: string } | null;
  backupTeacherId?: string | { _id: string; fullName: string } | null;
}

export interface ReadinessDetail {
  lessonId: string;
  title: string;
  ready: boolean;
  missingParts: string[];
}

export interface ReadinessResult {
  ready: boolean;
  sessionCount: number;
  readyLessonCount: number;
  details: ReadinessDetail[];
}

export interface OverdueSession {
  _id: string;
  classId: string;
  teacherId: string;
  sessionNumber: number;
  title: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
}

export interface EscalateLevel1Result {
  sessionId: string;
  resolved: boolean;
  reason: string;
  error?: string;
}
