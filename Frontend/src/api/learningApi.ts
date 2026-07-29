import axiosClient from "./axiosClient";

export interface ILessonProgress {
  _id: string;
  studentId: string;
  lessonId: string;
  classId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  lastViewedAt: string;
  totalLearningTime: number;
}

export interface ILearningActivity {
  _id: string;
  studentId: string;
  classId: string;
  lessonId: string | null;
  activityType: string;
  metadata: any;
  createdAt: string;
}

export interface IStudentBadge {
  _id: string;
  studentId: string;
  badgeCode: string;
  badgeType: string;
  title: string;
  description: string;
  icon: string;
  awardedAt: string;
}

export interface IStudentRank {
  studentId: string;
  fullName: string;
  email: string;
  avatar: string;
  lessonXP: number;
  attendanceXP: number;
  activityXP: number;
  gradeXP: number;
  totalXP: number;
  rank: number;
}

export interface IRankingResponse {
  items: IStudentRank[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

const learningApi = {
  // Progress
  getStudentProgress: (classId: string) => {
    return axiosClient.get<ILessonProgress[]>(`/api/learning/progress/class/${classId}`);
  },
  updateLessonProgress: (payload: { lessonId: string; classId: string; progress: number; durationSeconds?: number }) => {
    return axiosClient.post<ILessonProgress>(`/api/learning/progress`, payload);
  },

  // Ranking
  getClassRanking: (classId: string, params?: any) => {
    return axiosClient.get<IRankingResponse>(`/api/learning/ranking/class/${classId}`, { params });
  },
  getStudentRanking: (classId: string, studentId: string = "me") => {
    return axiosClient.get<IStudentRank>(`/api/learning/ranking/student/${studentId}`, { params: { classId } });
  },

  // Gamification
  getMyBadges: () => {
    return axiosClient.get<IStudentBadge[]>(`/api/learning/badges`);
  },
  getMyActivities: (params?: { classId?: string }) => {
    return axiosClient.get<ILearningActivity[]>(`/api/learning/activities`, { params });
  },
};

export default learningApi;
