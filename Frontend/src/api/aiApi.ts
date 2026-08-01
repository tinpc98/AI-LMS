import axiosClient from "./axiosClient";

/**
 * Trích dẫn nguồn kèm câu trả lời của chatbot (RAG).
 * Khớp citationSchema trong Backend/src/modules/ai/models/aiChatMessage.model.js.
 */
export interface ICitation {
  chunkId: string;
  sourceName: string;
  sourceType: string;
  lessonId: string;
  excerpt?: string;
  score?: number;
}

export type AISummaryStatus = "draft" | "approved" | "rejected" | "superseded";

/**
 * Kết quả sinh bộ câu hỏi bằng AI.
 *
 * TÔI ĐÃ ĐOÁN SAI hình dạng này ở lần viết đầu (tưởng là { questions: [...] }). Đọc
 * Backend/src/modules/ai/controllers/aiQuestionGeneration.controller.js mới thấy nó trả về
 * THÔNG TIN BỘ ĐỀ vừa tạo, không trả câu hỏi — câu hỏi nằm trong ExamSet, lấy bằng API khác.
 * tsc bắt được vì tôi tham chiếu một kiểu chưa định nghĩa; nếu tôi định nghĩa bừa thì kiểu sai
 * đã lọt qua.
 */
export interface IGeneratedQuestionSet {
  examSetId: string;
  lessonId: string;
  folderId?: string;
  title: string;
  status: string;
  questionCount: number;
  totalPoints: number;
  /** Cảnh báo về chất lượng nguồn tài liệu dùng để sinh câu hỏi. */
  sourceWarnings?: string[];
}

/** Khớp Backend/src/modules/ai/models/aiSummary.model.js. */
export interface IAISummary {
  _id: string;
  lessonId: string;
  classId: string;
  version: number;
  status: AISummaryStatus;
  summary: string;
  keyPoints?: string[];
  suggestedReviewTopics?: string[];
  createdAt?: string;
  /** Một số nơi đọc trường này thay cho `summary` — giữ để không vỡ chỗ gọi cũ. */
  content?: string;
}

export interface IChatMessageApi {
  _id?: string;
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  createdAt?: string;
  citations?: ICitation[];
  confidence?: number;
}

export interface IChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  citations?: ICitation[];
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
    // Một số phiên bản backend trả phiên chat trần, không bọc envelope.
    const rawSession = response.data?.data ?? (response.data as unknown as AIChatSessionApi);

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
    const rawMessage = response.data?.data ?? (response.data as unknown as IChatMessageApi);
    return normalizeChatMessage(rawMessage);
  },

  // ==========================================
  // AI LESSON SUMMARY API
  // ==========================================
  getLessonSummary: async (lessonId: string): Promise<IAISummary | null> => {
    const response = await axiosClient.get<{ data?: IAISummary }>(
      `/api/ai/lectures/${lessonId}/summary`
    );
    return response.data.data ?? null;
  },

  generateLessonSummary: async (lessonId: string): Promise<IAISummary> => {
    const response = await axiosClient.post<{ data: IAISummary }>(
      `/api/ai/lectures/${lessonId}/summary`
    );
    return response.data.data;
  },

  // ==========================================
  // AI QUESTION GENERATION API
  // ==========================================
  generateQuestionSet: async (
    lessonId: string,
    options: IQuestionGenerationOptions
  ): Promise<IGeneratedQuestionSet> => {
    const response = await axiosClient.post<{ data: IGeneratedQuestionSet }>(
      `/api/ai/lectures/${lessonId}/question-sets/generate`,
      options
    );
    return response.data.data;
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
    return response.data.data;
  },

  confirmGradeSuggestion: async (
    attemptId: string,
    questionId: string,
    data: { grade: number; feedback?: string; aiFeedback?: string }
  ): Promise<{ success: boolean }> => {
    const response = await axiosClient.post<{ data?: { success: boolean } }>(
      `/api/ai/exam-attempts/${attemptId}/questions/${questionId}/grade-confirmation`,
      data
    );
    return response.data.data ?? { success: true };
  },
};

export default aiApi;
