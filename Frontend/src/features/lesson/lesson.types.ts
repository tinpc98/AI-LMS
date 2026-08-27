import type { ContentBlock, Question } from "../question/question.types";

export type LessonBlockType = "VIDEO" | "DOCUMENT" | "PRACTICE_QUIZ";
export type VideoPlatform = "YOUTUBE" | "VIMEO";

export interface LessonVideoBlockData {
  platform: VideoPlatform;
  externalId: string;
  url: string;
  title?: string;
  durationSeconds: number;
}

export interface LessonDocumentBlockData {
  title?: string;
  publicId: string;
  fileType?: string;
  bytes?: number;
}

export interface PracticeQuizQuestion {
  // Chuỗi khi chưa populate (payload tạo/sửa); object Question đầy đủ khi lấy Lesson để xem
  // (options KHÔNG có isCorrect với học sinh — xem lesson.controller.js#stripQuizAnswers).
  questionId: string | Question;
  order: number;
}

export interface PracticeQuiz {
  _id: string;
  title: string;
  questions: PracticeQuizQuestion[];
}

export interface LessonBlock {
  _id: string;
  type: LessonBlockType;
  order: number;
  isRequired: boolean;
  video?: LessonVideoBlockData | null;
  document?: LessonDocumentBlockData | null;
  quizId?: string | PracticeQuiz | null;
}

export interface Lesson {
  _id: string;
  topicId: string;
  title: string;
  description?: string;
  content: ContentBlock[];
  blocks: LessonBlock[];
  order: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockProgress {
  blockId: string;
  type: LessonBlockType;
  completed: boolean;
  completedAt?: string | null;
  watchedRanges?: { start: number; end: number }[];
  watchedSeconds?: number;
  firstOpenedAt?: string | null;
  totalOpenSeconds?: number;
  bestScorePercent?: number | null;
}

export interface LessonProgress {
  _id: string;
  studentId: string;
  lessonId: string;
  blocks: BlockProgress[];
  completed: boolean;
  completedAt?: string | null;
  progress: number;
}

export interface QuizGradedAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  correctOptionIds: string[];
}

export interface QuizAttemptResult {
  attempt: { _id: string; attemptNumber: number; scorePercent: number; submittedAt: string };
  gradedAnswers: QuizGradedAnswer[];
  scorePercent: number;
  bestScorePercent: number;
  progress: LessonProgress;
}

// TÍNH NĂNG MỚI: payload phía giáo viên khớp đúng lesson.service.js#createLessonService —
// block gửi lên KHÔNG có _id (server tự sinh khi lưu).
export interface CreateLessonBlockInput {
  type: LessonBlockType;
  isRequired: boolean;
  video?: LessonVideoBlockData;
  document?: LessonDocumentBlockData;
  quizId?: string;
}

export interface CreateLessonPayload {
  topicId?: string;
  classId?: string;
  title: string;
  description?: string;
  blocks?: CreateLessonBlockInput[];
  order?: number;
  status?: "DRAFT" | "PUBLISHED";
}

export interface UpdateLessonPayload {
  title?: string;
  description?: string;
  blocks?: CreateLessonBlockInput[];
  order?: number;
}

export interface UploadedDocument {
  publicId: string;
  fileType: string;
  bytes: number;
  title: string;
}
