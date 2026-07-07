// Student

interface ITeacher {
  name: string;
  avatarUrl: string;
}
interface ISchedule {
  days: string[];
  time: string;
}
export interface IMyClass {
  id: string;
  title: string;
  subtitle: string;
  teacher: ITeacher;
  schedule: ISchedule;
  progress: number;
  isAiRecommended: boolean;
  thumbnailUrl: string;
}

// Teacher

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

// Dữ liệu gửi lên khi tạo lớp mới
export interface ICreateClassPayload {
  className: string;
  subjectId?: string;
}
