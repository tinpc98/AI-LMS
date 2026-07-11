export interface IStudentSummary {
  _id: string;
  fullName: string;
  email: string;
}
export interface IClass {
  _id: string;
  className: string;
  joinCode: string;
  subjectId?: string | null;
  teacherId: {
    _id: string;
    fullName: string;
    email: string;
  };
  students: IStudentSummary[];
  status: "active" | "completed";
  createdAt: string;
}

export interface ICreateClassPayload {
  className: string;
  subjectId?: string;
}
