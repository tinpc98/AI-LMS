import type { AIFeature } from "../types/aiManagement.types";

export const mockAIFeatures: AIFeature[] = [
  {
    id: "f-1",
    name: "AI Chatbot 24/7",
    code: "AI_CHATBOT",
    category: "Chatbot",
    description: "Giải đáp bài tập, lý thuyết và thắc mắc học tập trực tuyến cho học sinh.",
    enabled: true,
    assignedModelId: "m-4", // Gemini 2.5 Flash
    assignedPromptId: "p-1",
    dailyRequests: 6840,
    avgLatencyMs: 380,
  },
  {
    id: "f-2",
    name: "AI Summary (Tóm tắt bài học)",
    code: "AI_SUMMARY",
    category: "Summary",
    description: "Tóm tắt bài giảng, trích xuất công thức và ý chính tự động.",
    enabled: true,
    assignedModelId: "m-2", // Gemini 2.5 Pro
    assignedPromptId: "p-2",
    dailyRequests: 2150,
    avgLatencyMs: 650,
  },
  {
    id: "f-3",
    name: "AI Quiz Generator",
    code: "AI_QUIZ_GEN",
    category: "Quiz Generator",
    description: "Sinh bộ câu hỏi trắc nghiệm nhanh cho giáo viên và bài ôn tập cho học sinh.",
    enabled: true,
    assignedModelId: "m-1", // GPT-4.5
    assignedPromptId: "p-3",
    dailyRequests: 3120,
    avgLatencyMs: 520,
  },
  {
    id: "f-4",
    name: "AI Exam Generator",
    code: "AI_EXAM_GEN",
    category: "Exam Generator",
    description: "Tạo đề thi trắc nghiệm & tự luận theo ma trận đề chuẩn Bộ GD&ĐT.",
    enabled: true,
    assignedModelId: "m-1", // GPT-4.5
    assignedPromptId: "p-4",
    dailyRequests: 1420,
    avgLatencyMs: 890,
  },
  {
    id: "f-5",
    name: "AI Homework Assistant",
    code: "AI_HOMEWORK",
    category: "Homework Assistant",
    description: "Gợi ý cách giải bài tập về nhà theo từng bước không cho sẵn đáp án.",
    enabled: true,
    assignedModelId: "m-2", // Gemini 2.5 Pro
    assignedPromptId: "p-1",
    dailyRequests: 4300,
    avgLatencyMs: 440,
  },
  {
    id: "f-6",
    name: "AI Essay Evaluation",
    code: "AI_ESSAY_EVAL",
    category: "Essay Evaluation",
    description: "Chấm điểm bài tự luận Tiếng Anh & Văn, chỉ ra lỗi và nhận xét chi tiết.",
    enabled: true,
    assignedModelId: "m-3", // Claude 3.5 Sonnet
    assignedPromptId: "p-5",
    dailyRequests: 980,
    avgLatencyMs: 1100,
  },
  {
    id: "f-7",
    name: "AI Learning Recommendation",
    code: "AI_RECOMMENDATION",
    category: "Learning Recommendation",
    description: "Phân tích kết quả luyện đề để gợi ý bài học cá nhân hóa cho từng học sinh.",
    enabled: false,
    assignedModelId: "m-4", // Gemini 2.5 Flash
    assignedPromptId: "p-6",
    dailyRequests: 0,
    avgLatencyMs: 0,
  },
];
