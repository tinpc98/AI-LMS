export interface IAttachment {
  name: string;
  url: string;
  publicId: string;
}

export interface IAssignment {
  _id: string;
  title: string;
  description?: string;
  attachments: IAttachment[];
  deadline: string;
  classId: string;
  lessonId?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISubmission {
  _id: string;
  assignmentId: string;
  studentId: string | { _id: string; fullName?: string; email?: string };
  classId: string;
  content?: string;
  attachments: IAttachment[];
  status: "submitted" | "late" | "graded";
  grade: number | null;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}
