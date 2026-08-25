import type { ContentBlock } from "../question/question.types";

export interface Video {
  _id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  uploadedBy: string;
}

export interface Document {
  _id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
}

export interface Lesson {
  _id: string;
  topicId: string;
  title: string;
  description?: string;
  content: ContentBlock[];
  videoIds: string[] | Video[];
  documentIds: string[] | Document[];
  order: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  _id: string;
  studentId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}
