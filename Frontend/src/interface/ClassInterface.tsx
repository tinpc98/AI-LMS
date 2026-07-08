// Frontend/src/interface/classInterface.tsx
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
  students: string[];
  status: "active" | "completed";
  createdAt: string;
}

export interface ICreateClassPayload {
  className: string;
  subjectId?: string;
}
