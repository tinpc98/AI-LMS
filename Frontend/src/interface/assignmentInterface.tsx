export interface IAttachment {
  name: string;
  url: string;
  publicId: string;
  format?: string | null;
}

export type SubmissionMode = "file" | "link" | "direct" | "any";

export interface IAssignmentQuestion {
  _id?: string;
  order: number;
  content: string;
  required: boolean;
}

export interface IAssignment {
  _id: string;
  title: string;
  description?: string;
  submissionMode?: SubmissionMode;
  maxScore?: number;
  hasGradedSubmissions?: boolean;
  questions?: IAssignmentQuestion[];
  attachments: IAttachment[];
  deadline: string;
  classId: string;
  lessonId?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubmissionAnswer {
  questionId: string;
  content: string;
}

export interface ISubmission {
  _id: string;
  assignmentId: string;
  studentId: string | { _id: string; fullName?: string; email?: string; avatar?: string };
  classId: string;
  content?: string;
  submissionType?: "file" | "link" | "direct" | null;
  linkUrl?: string | null;
  answers?: ISubmissionAnswer[];
  attachments: IAttachment[];
  status: "draft" | "submitted" | "late" | "graded" | "withdrawn" | "resubmitted";
  grade: number | null;
  feedback?: string;
  aiFeedback?: string;
  gradedBy?: string | { _id: string; fullName?: string; email?: string };
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
