import type { ContentBlock } from "../question/question.types";

export interface AssignmentQuestion {
  questionId: string;
  order: number;
  points: number;
}

export interface SolutionResource {
  _id?: string;
  type: "VIDEO" | "DOCUMENT";
  title: string;
  videoId?: string;
  documentId?: string;
  questionIds: string[];
}

export interface Assignment {
  _id: string;
  topicId: string;
  title: string;
  description?: string;
  instructions?: ContentBlock[];
  questions: AssignmentQuestion[];
  assignedAfterSessionId?: string;
  dueBeforeSessionId?: string;
  solutionResources?: SolutionResource[];
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

export interface AttemptQuestion {
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

export interface AssignmentAttempt {
  _id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  questions: AttemptQuestion[];
  score?: number;
  startedAt: string;
  submittedAt?: string;
}
