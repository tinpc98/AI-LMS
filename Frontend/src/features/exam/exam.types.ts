import type { ContentBlock } from "../question/question.types";

export interface ExamQuestion {
  questionId: string;
  order: number;
  points: number;
}

export interface Exam {
  _id: string;
  topicId: string;
  title: string;
  description?: string;
  instructions?: ContentBlock[];
  questions: ExamQuestion[];
  duration: number; // minutes
  attemptsAllowed: number;
  scorePolicy: "HIGHEST" | "LATEST";
  startAt?: string;
  endAt?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OptionSnapshot {
  id: string;
  content: ContentBlock[];
  order: number;
}

export interface QuestionSnapshot {
  type: string;
  content: ContentBlock[];
  options?: OptionSnapshot[];
}

export interface ExamAttemptQuestion {
  questionId: string;
  questionSnapshot: QuestionSnapshot;
  order: number;
  points: number;
  answer?: {
    selectedOptionIds?: string[];
    content?: ContentBlock[];
  };
  isCorrect?: boolean | null;
  score?: number;
}

export interface ExamAttempt {
  _id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "PARTIALLY_GRADED" | "GRADED";
  questions: ExamAttemptQuestion[];
  score?: number;
  cheatWarnings: number;
  sessionToken: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
}
