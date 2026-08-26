export type ComplaintCategory =
  "TEACHING_QUALITY" | "NO_SHOW_UNREPORTED" | "INAPPROPRIATE_BEHAVIOR" | "CHILD_SAFETY" | "OTHER";

export type ComplaintStatus = "SUBMITTED" | "UNDER_REVIEW" | "RESOLVED";

export interface ComplaintUserInfo {
  _id: string;
  fullName: string;
  email: string;
}

export interface ComplaintClassInfo {
  _id: string;
  name: string;
  code: string;
}

export interface ComplaintRecord {
  _id: string;
  classId?: string | ComplaintClassInfo | null;
  sessionId?: string | null;
  reportedBy: string | ComplaintUserInfo;
  aboutTeacherId?: string | ComplaintUserInfo | null;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | ComplaintUserInfo | null;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  classId?: string;
  sessionId?: string;
  aboutTeacherId?: string;
  category: ComplaintCategory;
  description: string;
}

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  TEACHING_QUALITY: "Chất lượng giảng dạy",
  NO_SHOW_UNREPORTED: "Giáo viên vắng không báo trước",
  INAPPROPRIATE_BEHAVIOR: "Hành vi không phù hợp",
  CHILD_SAFETY: "An toàn trẻ em (khẩn cấp)",
  OTHER: "Khác",
};
