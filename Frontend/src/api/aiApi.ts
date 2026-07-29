import axiosClient from "./axiosClient";

export interface IChatMessage {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metadata?: any;
}

export interface IChatSession {
  _id: string;
  lessonId?: string;
  title: string;
  messages: IChatMessage[];
}

export interface IQuestionGenerationOptions {
  folderId: string;
  title: string;
  questionCount: number;
  questionTypes: Record<string, number>;
  difficultyDistribution: Record<string, number>;
}

const aiApi = {
  // ==========================================
  // AI CHAT API
  // ==========================================
  createChatSession: async (lessonId?: string): Promise<IChatSession> => {
    const payload = lessonId ? { lessonId } : {};
    const response = await axiosClient.post<{ data: IChatSession }>("/api/ai/chat/sessions", payload);
    return response.data.data ?? (response.data as any);
  },

  getChatHistory: async (sessionId: string): Promise<IChatMessage[]> => {
    const response = await axiosClient.get<{ data: { messages: IChatMessage[] } }>(`/api/ai/chat/sessions/${sessionId}/messages`);
    return response.data.data?.messages ?? [];
  },

  sendChatMessage: async (sessionId: string, message: string): Promise<IChatMessage> => {
    const response = await axiosClient.post<{ data: { response: IChatMessage } }>(
      `/api/ai/chat/sessions/${sessionId}/messages`,
      { message }
    );
    return response.data.data?.response ?? (response.data as any);
  },

  // ==========================================
  // AI LESSON SUMMARY API
  // ==========================================
  getLessonSummary: async (lessonId: string): Promise<any> => {
    const response = await axiosClient.get(`/api/ai/lectures/${lessonId}/summary`);
    return response.data.data ?? response.data;
  },

  generateLessonSummary: async (lessonId: string): Promise<any> => {
    const response = await axiosClient.post(`/api/ai/lectures/${lessonId}/summary`);
    return response.data.data ?? response.data;
  },

  // ==========================================
  // AI QUESTION GENERATION API
  // ==========================================
  generateQuestionSet: async (lessonId: string, options: IQuestionGenerationOptions): Promise<any> => {
    const response = await axiosClient.post(`/api/ai/lectures/${lessonId}/question-sets/generate`, options);
    return response.data.data ?? response.data;
  },

  // ==========================================
  // AI ESSAY GRADING API
  // ==========================================
  generateGradeSuggestion: async (attemptId: string, questionId: string): Promise<{ suggestedScore: number, feedback: string }> => {
    const response = await axiosClient.post<{ data: { suggestedScore: number, feedback: string } }>(
      `/api/ai/exam-attempts/${attemptId}/questions/${questionId}/grade-suggestion`
    );
    return response.data.data ?? (response.data as any);
  },

  confirmGradeSuggestion: async (
    attemptId: string,
    questionId: string,
    data: { grade: number; feedback?: string; aiFeedback?: string }
  ): Promise<any> => {
    const response = await axiosClient.post(
      `/api/ai/exam-attempts/${attemptId}/questions/${questionId}/grade-confirmation`,
      data
    );
    return response.data.data ?? response.data;
  },
};

export default aiApi;
