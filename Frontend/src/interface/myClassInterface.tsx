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
