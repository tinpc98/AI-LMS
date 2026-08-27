// Xác minh 3 tầng & bảo lãnh chéo (EduSpace mechanism design Phần C.1/C.2) — Teacher self-service.
export type VerificationTier = "L1" | "L2" | "L3";

export const VERIFICATION_TIER_LABELS: Record<VerificationTier, string> = {
  L1: "L1 — Xác thực cơ bản (OTP)",
  L2: "L2 — Đã duyệt bằng cấp/video",
  L3: "L3 — Được cộng đồng bảo lãnh",
};

export const VERIFICATION_TIER_COLORS: Record<VerificationTier, string> = {
  L1: "default",
  L2: "processing",
  L3: "gold",
};

export interface L3Eligibility {
  eligible: boolean;
  completedCommunityCohorts: number;
  requiredCohorts: number;
  notRemovedFromPool: boolean;
  hasAtLeastOneVoucher: boolean;
}

export interface MyVerificationStatus {
  verificationTier: VerificationTier;
  reliabilityScore: number;
  poolStatus: "ACTIVE" | "LOCKED" | "REMOVED";
  poolLockedUntil: string | null;
  vouchLimit: number;
  vouchedByCount: number;
  vouchSuspendedUntil: string | null;
  l3Eligibility: L3Eligibility | null;
}

export interface CoTaughtColleague {
  id: string;
  fullName: string;
}

export interface VouchResult {
  promotion: { promoted: boolean; reason?: string };
}
