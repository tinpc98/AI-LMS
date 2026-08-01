import axiosClient from "./axiosClient";
import { unwrap, unwrapOrNull, type ApiEnvelope } from "./unwrap";

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

/** Khớp enum trong Backend/src/modules/badge/learningActivity.model.js. */
export type LearningActivityType =
  | "Lesson Viewed"
  | "Lesson Completed"
  | "Assignment Submitted"
  | "Exam Finished"
  | "Attendance"
  | "AI Interaction";

export interface ILearningActivity {
  _id: string;
  studentId: string;
  classId: string;
  lessonId: string | null;
  activityType: LearningActivityType;
  /**
   * Dữ liệu kèm theo, khác nhau tuỳ loại hoạt động.
   *
   * Backend khai báo Schema.Types.Mixed nên không có hình dạng cố định. Dùng `unknown` chứ
   * KHÔNG dùng `any`: nơi đọc buộc phải kiểm tra trước khi dùng, thay vì gõ `.abc` bừa và
   * nhận undefined lúc chạy.
   */
  metadata: Record<string, unknown>;
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
  getStudentProgress: async (classId: string): Promise<ILessonProgress[]> => {
    const response = await axiosClient.get<ApiEnvelope<ILessonProgress[]>>(
      `/api/learning/progress/class/${classId}`
    );
    return unwrap(response.data, []);
  },
  updateLessonProgress: async (payload: {
    lessonId: string;
    classId: string;
    progress: number;
    durationSeconds?: number;
  }) => {
    const response = await axiosClient.post<ApiEnvelope<ILessonProgress>>(
      `/api/learning/progress`,
      payload
    );
    return unwrapOrNull(response.data);
  },

  // Ranking
  getClassRanking: async (
    classId: string,
    params?: { page?: number; limit?: number }
  ): Promise<IRankingResponse | null> => {
    const response = await axiosClient.get<ApiEnvelope<IRankingResponse>>(
      `/api/learning/ranking/class/${classId}`,
      { params }
    );
    return unwrapOrNull(response.data);
  },
  getStudentRanking: async (classId: string, studentId: string = "me") => {
    const response = await axiosClient.get<ApiEnvelope<IStudentRank>>(
      `/api/learning/ranking/student/${studentId}`,
      { params: { classId } }
    );
    return unwrapOrNull(response.data);
  },

  // Gamification
  getMyBadges: async () => {
    const response = await axiosClient.get<ApiEnvelope<IStudentBadge[]>>(`/api/learning/badges`);
    return unwrap(response.data, []);
  },
  getMyActivities: async (params?: { classId?: string }) => {
    const response = await axiosClient.get<ApiEnvelope<ILearningActivity[]>>(
      `/api/learning/activities`,
      { params }
    );
    return unwrap(response.data, []);
  },
};

export default learningApi;
