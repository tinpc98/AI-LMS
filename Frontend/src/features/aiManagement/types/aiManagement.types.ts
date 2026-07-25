export type ModelProvider = "OpenAI" | "Google" | "Anthropic" | "Meta" | "Custom";
export type ModelStatus = "Active" | "Disabled";

export interface AIModel {
  id: string;
  provider: ModelProvider;
  name: string;
  version: string;
  status: ModelStatus;
  priority: number; // 1 = highest
  isDefault: boolean;
  maxContextTokens: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptCategory =
  | "Chatbot"
  | "Summary"
  | "Quiz Generator"
  | "Exam Generator"
  | "Homework Assistant"
  | "Essay Evaluation"
  | "Learning Recommendation";

export type PromptStatus = "Active" | "Disabled";

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  modelId: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  variables: string[]; // e.g. ["student_name", "subject", "question_count"]
  status: PromptStatus;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeCategory = "Toán" | "Vật Lý" | "Hóa Học" | "Tiếng Anh" | "Chung";
export type KnowledgeFileType = "pdf" | "docx" | "zip" | "txt";
export type KnowledgeStatus = "Indexed" | "Pending" | "Failed";

export interface KnowledgeDocument {
  id: string;
  name: string;
  category: KnowledgeCategory;
  fileType: KnowledgeFileType;
  fileSizeMB: number;
  chunksCount: number;
  status: KnowledgeStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIFeature {
  id: string;
  name: string;
  code: string;
  category: PromptCategory;
  description: string;
  enabled: boolean;
  assignedModelId: string;
  assignedPromptId: string;
  dailyRequests: number;
  avgLatencyMs: number;
}

export interface AIConfiguration {
  defaultModelId: string;
  temperature: number; // 0 to 1
  topP: number; // 0 to 1
  maxTokens: number;
  requestTimeoutSec: number;
  retryCount: number;
  dailyRequestLimit: number;
  teacherRequestLimit: number;
  studentRequestLimit: number;
  enableSafetyFilter: boolean;
  enableUsageLogging: boolean;
}

export interface AIDashboardStats {
  activeModelsCount: number;
  totalModelsCount: number;
  promptTemplatesCount: number;
  knowledgeDocsCount: number;
  enabledFeaturesCount: number;
  totalFeaturesCount: number;
  todayRequestsCount: number;
  avgResponseTimeMs: number;
}
