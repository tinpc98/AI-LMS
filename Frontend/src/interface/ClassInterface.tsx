export interface IStudentSummary {
  _id: string;
  fullName: string;
  email: string;
}
export interface IClass {
  _id: string;
  name: string;
  code?: string;
  joinCode: string;
  subjectId?: string | null;
  teacherId?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  classroom?: string;
  room?: string;
  mode?: "OFFLINE" | "ONLINE";
  description?: string;
  isEnrollmentOpen?: boolean;
  students: IStudentSummary[];
  status: "DRAFT" | "OPEN" | "FULL" | "CLOSED" | "ARCHIVED";
  createdAt: string;
}

export interface ICreateClassPayload {
  name: string;
  subjectId?: string;
}
