import type { ContentBlock as IContentBlock } from "../features/question/question.types";

export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface IAssignmentQuestion {
  questionId: string | any;
  order: number;
  points: number;
}

export interface IAssignment {
  _id: string;
  topicId: string | any;
  title: string;
  description?: string;
  instructions?: IContentBlock[];
  questions: IAssignmentQuestion[];
  status: AssignmentStatus;
  createdBy: string | any;
  createdAt: string;
  updatedAt: string;
  /** TÍNH NĂNG MỚI: thời gian làm bài (phút), bắt buộc — mirror IExam.duration. */
  duration: number;
  /** Khung thời gian mở/đóng bài tập, tùy chọn — mirror IExam.startAt/endAt. */
  startAt?: string | null;
  endAt?: string | null;
}

export interface IAttemptOptionSnapshot {
  id: string;
  content: IContentBlock[];
  order: number;
}

export interface IAttemptQuestionSnapshot {
  type: "MCQ" | "ESSAY" | "SHORT_ANSWER" | string;
  content: IContentBlock[];
  options: IAttemptOptionSnapshot[];
}

export interface IAttemptAnswer {
  selectedOptionIds?: string[];
  content?: IContentBlock[];
  feedback?: string;
}

export interface IAttemptQuestion {
  questionId: string;
  questionSnapshot: IAttemptQuestionSnapshot;
  order: number;
  points: number;
  answer?: IAttemptAnswer;
  isCorrect?: boolean | null;
  score?: number;
}

export interface IAssignmentAttempt {
  _id: string;
  assignmentId: string | IAssignment;
  studentId: string | any;
  attemptNumber: number;
  status: AttemptStatus;
  questions: IAttemptQuestion[];
  score: number | null;
  startedAt: string;
  /** TÍNH NĂNG MỚI: hạn nộp của riêng lượt làm bài này — tính 1 lần lúc bắt đầu. */
  expiresAt: string;
  submittedAt: string | null;
  isLate?: boolean;
  lateBySeconds?: number;
  performanceProcessedAt: string | null;
}
