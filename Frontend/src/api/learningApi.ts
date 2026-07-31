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
  getStudentProgress: async (classId: string) => {
    const response = await axiosClient.get<ILessonProgress[]>(
      `/api/learning/progress/class/${classId}`
    );
    return (response.data as any).data ?? response.data ?? [];
  },
  updateLessonProgress: async (payload: {
    lessonId: string;
    classId: string;
    progress: number;
    durationSeconds?: number;
  }) => {
    const response = await axiosClient.post<ILessonProgress>(`/api/learning/progress`, payload);
    return (response.data as any).data ?? response.data;
  },

  // Ranking
  getClassRanking: async (classId: string, params?: any) => {
    const response = await axiosClient.get<IRankingResponse>(
      `/api/learning/ranking/class/${classId}`,
      { params }
    );
    return (response.data as any).data ?? response.data;
  },
  getStudentRanking: async (classId: string, studentId: string = "me") => {
    const response = await axiosClient.get<IStudentRank>(
      `/api/learning/ranking/student/${studentId}`,
      { params: { classId } }
    );
    return (response.data as any).data ?? response.data;
  },

  // Gamification
  getMyBadges: async () => {
    const response = await axiosClient.get<IStudentBadge[]>(`/api/learning/badges`);
    return (response.data as any).data ?? response.data ?? [];
  },
  getMyActivities: async (params?: { classId?: string }) => {
    const response = await axiosClient.get<ILearningActivity[]>(`/api/learning/activities`, {
      params,
    });
    return (response.data as any).data ?? response.data ?? [];
  },
};

export default learningApi;
