export type SkillStatus = "ACTIVE" | "ARCHIVED";

export interface SkillRecord {
  id: string;
  name: string;
  description?: string;
  topicId: string;
  order: number;
  status: SkillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillPayload {
  topicId: string;
  name: string;
  description?: string;
}

export interface UpdateSkillPayload {
  name?: string;
  description?: string;
}
