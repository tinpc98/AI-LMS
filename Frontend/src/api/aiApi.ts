import axiosClient from "./axiosClient";

export interface IChatMessageApi {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  createdAt?: string;
  citations?: any[];
  confidence?: number;
}

export interface IChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  citations?: any[];
  confidence?: number;
}

export interface AIChatSessionApi {
  _id?: string;
  id?: string;
  lessonId?: string;
  title?: string;
  messages?: IChatMessageApi[];
  createdAt?: string;
}

export interface AIChatSession {
  id: string;
  lessonId?: string;
  title?: string;
  messages?: IChatMessage[];
  createdAt?: string;
}

export interface CreateChatSessionResponse {
  success: boolean;
  data: AIChatSessionApi;
}

export interface IQuestionGenerationOptions {
  folderId: string;
  title: string;
  questionCount: number;
  questionTypes: Record<string, number>;
  difficultyDistribution: Record<string, number>;
}

export class AIChatContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIChatContractError";
  }
}

function normalizeChatMessage(raw: IChatMessageApi): IChatMessage {
  const msgId = raw.id ?? raw._id;
  return {
    id: msgId,
    role: raw.role,
    content: raw.content,
    timestamp: raw.createdAt ?? raw.timestamp,
    citations: raw.citations,
    confidence: raw.confidence,
  };
}

function normalizeAIChatSession(raw: AIChatSessionApi): AIChatSession {
  const id = raw.id ?? raw._id;

  if (typeof id !== "string" || !id.trim()) {
    throw new AIChatContractError("Create session response does not contain a valid session ID");
  }

  return {
    id,
    lessonId: typeof raw.lessonId === "string" ? raw.lessonId : undefined,
    title: typeof raw.title === "string" ? raw.title : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    messages: Array.isArray(raw.messages) ? raw.messages.map(normalizeChatMessage) : undefined,
  };
}

const aiApi = {
  // ==========================================
  // AI CHAT API
  // ==========================================
  createChatSession: async (lessonId?: string): Promise<AIChatSession> => {
    const payload = lessonId ? { lessonId } : {};
    console.log("[AI Chat] create session payload", payload);
    const response = await axiosClient.post<CreateChatSessionResponse>(
      "/api/ai/chat/sessions",
      payload
    );
    console.log("[AI Chat] create session response", response.data);

    // Support nested response.data.data
    const rawSession = response.data?.data ?? (response.data as any);

    const normalizedSession = normalizeAIChatSession(rawSession);
    console.log("[AI Chat] normalized session", normalizedSession);

    return normalizedSession;
  },

  getChatHistory: async (sessionId: string): Promise<IChatMessage[]> => {
    const response = await axiosClient.get<{ data: { messages: IChatMessageApi[] } }>(
      `/api/ai/chat/sessions/${sessionId}/messages`
    );
    const rawMessages = response.data?.data?.messages ?? [];
    return rawMessages.map(normalizeChatMessage);
  },

  sendChatMessage: async (sessionId: string, message: string): Promise<IChatMessage> => {
    const response = await axiosClient.post<{ data: IChatMessageApi }>(
      `/api/ai/chat/sessions/${sessionId}/messages`,
      { message }
    );
    const rawMessage = response.data?.data ?? (response.data as any);
    return normalizeChatMessage(rawMessage);
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
  generateQuestionSet: async (
    lessonId: string,
    options: IQuestionGenerationOptions
  ): Promise<any> => {
    const response = await axiosClient.post(
      `/api/ai/lectures/${lessonId}/question-sets/generate`,
      options
    );
    return response.data.data ?? response.data;
  },

  // ==========================================
  // AI ESSAY GRADING API
  // ==========================================
  generateGradeSuggestion: async (
    attemptId: string,
    questionId: string
  ): Promise<{ suggestedScore: number; feedback: string }> => {
    const response = await axiosClient.post<{ data: { suggestedScore: number; feedback: string } }>(
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
