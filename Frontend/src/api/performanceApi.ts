import axiosClient from "./axiosClient";

export interface IStudentPerformance {
  _id: string;
  studentId: string;
  courseId: string;
  topicId: { _id: string; name: string; order: number };
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalAttempts: number;
  masteryLevel: "FOUNDATIONAL" | "DEVELOPING" | "PROFICIENT" | "MASTERED";
  lastAttemptAt: string;
}

export interface IWeakness {
  _id: string;
  topicId: { _id: string; name: string; order: number };
  weaknessScore: number;
  accuracy: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  lastCalculatedAt: string;
}

export interface IAIRecommendation {
  _id: string;
  recommendedTopics: Array<{ _id: string; name: string }>;
  explanation: string;
  priority: string;
  status: string;
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const performanceApi = {
  // Student
  getMyPerformance: (courseId?: string): Promise<ApiResponse<IStudentPerformance[]>> =>
    axiosClient.get("/performance/me", { params: { courseId } }),

  getMyWeaknesses: (courseId?: string): Promise<ApiResponse<IWeakness[]>> =>
    axiosClient.get("/performance/me/weaknesses", { params: { courseId } }),
    
  getMyRecommendations: (courseId?: string): Promise<ApiResponse<IAIRecommendation[]>> =>
    axiosClient.get("/performance/me/recommendations", { params: { courseId } }),
    
  generateMyRecommendation: (courseId: string): Promise<ApiResponse<IAIRecommendation>> =>
    axiosClient.post("/performance/me/recommendations/generate", { courseId }),
};
