export type TopicStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface TopicRecord {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  order: number;
  status: TopicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicPayload {
  courseId: string;
  name: string;
  description?: string;
}

export interface UpdateTopicPayload {
  name?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
