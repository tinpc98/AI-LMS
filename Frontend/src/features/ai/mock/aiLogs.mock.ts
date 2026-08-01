export interface AILogRecord {
  id: string;
  feature: "Chatbot" | "Summary" | "Quiz" | "Exam" | "Homework";
  userId: string;
  userName: string;
  prompt: string;
  tokensUsed: number;
  responseTimeMs: number;
  status: "Success" | "Failed";
  createdAt: string;
}

export const mockAILogs: AILogRecord[] = [
  {
    id: "log-101",
    feature: "Chatbot",
    userId: "u5",
    userName: "Hoàng Văn E",
    prompt: "Giải chi tiết câu 42 đề thi thử Toán THPT QG 2026",
    tokensUsed: 420,
    responseTimeMs: 850,
    status: "Success",
    createdAt: "2026-07-26T08:15:00.000Z",
  },
  {
    id: "log-102",
    feature: "Summary",
    userId: "u2",
    userName: "Trần Thị Bình",
    prompt: "Tóm tắt lý thuyết Dao động điều hòa - Vật Lý 12",
    tokensUsed: 650,
    responseTimeMs: 1200,
    status: "Success",
    createdAt: "2026-07-26T09:30:00.000Z",
  },
  {
    id: "log-103",
    feature: "Quiz",
    userId: "u2",
    userName: "Trần Thị Bình",
    prompt: "Tạo 10 câu hỏi trắc nghiệm Este - Lipit Hóa 12",
    tokensUsed: 890,
    responseTimeMs: 1540,
    status: "Success",
    createdAt: "2026-07-26T10:05:00.000Z",
  },
  {
    id: "log-104",
    feature: "Exam",
    userId: "u1",
    userName: "Nguyễn Văn An",
    prompt: "Sinh đề thi minh họa Tiếng Anh THPT QG 2026",
    tokensUsed: 1450,
    responseTimeMs: 2400,
    status: "Success",
    createdAt: "2026-07-26T11:20:00.000Z",
  },
  {
    id: "log-105",
    feature: "Homework",
    userId: "u4",
    userName: "Phạm Minh Duyên",
    prompt: "Chấm bài tự luận Tiếng Anh lớp ANH12-70-05",
    tokensUsed: 780,
    responseTimeMs: 1100,
    status: "Success",
    createdAt: "2026-07-26T12:00:00.000Z",
  },
  {
    id: "log-106",
    feature: "Chatbot",
    userId: "u6",
    userName: "Đỗ Thị Phương",
    prompt: "Hỏi về công thức tính thể tích khối tròn xoay",
    tokensUsed: 310,
    responseTimeMs: 620,
    status: "Success",
    createdAt: "2026-07-26T12:45:00.000Z",
  },
  {
    id: "log-107",
    feature: "Quiz",
    userId: "u3",
    userName: "Lê Văn Cường",
    prompt: "Tạo 5 câu hỏi nhanh về Sóng cơ học",
    tokensUsed: 520,
    responseTimeMs: 980,
    status: "Success",
    createdAt: "2026-07-25T14:10:00.000Z",
  },
  {
    id: "log-108",
    feature: "Exam",
    userId: "u2",
    userName: "Trần Thị Bình",
    prompt: "Tạo đề kiểm tra 45 phút Chương 1 Đại Số 12",
    tokensUsed: 1200,
    responseTimeMs: 2100,
    status: "Success",
    createdAt: "2026-07-25T16:30:00.000Z",
  },
  {
    id: "log-109",
    feature: "Homework",
    userId: "u2",
    userName: "Trần Thị Bình",
    prompt: "Chấm tự động 25 bài tập về nhà Toán 12 K25",
    tokensUsed: 950,
    responseTimeMs: 1800,
    status: "Success",
    createdAt: "2026-07-24T10:00:00.000Z",
  },
  {
    id: "log-110",
    feature: "Chatbot",
    userId: "u5",
    userName: "Hoàng Văn E",
    prompt: "Giải thích khái niệm điện trường đều",
    tokensUsed: 280,
    responseTimeMs: 550,
    status: "Success",
    createdAt: "2026-07-24T15:20:00.000Z",
  },
];
