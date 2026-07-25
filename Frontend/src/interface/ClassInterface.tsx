export interface IStudentSummary {
  _id: string;
  fullName: string;
  email: string;
}
export interface IClass {
  _id: string;
  className: string;
  classCode?: string;
  joinCode: string;
  subjectId?: string | null;
  teacherId?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  classroom?: string;
  room?: string;
  learningMode?: "Offline" | "Online" | "Hybrid";
  description?: string;
  isEnrollmentOpen?: boolean;
  students: IStudentSummary[];
  status: "active" | "completed" | "closed";
  createdAt: string;
}

export interface ICreateClassPayload {
  className: string;
  subjectId?: string;
}
