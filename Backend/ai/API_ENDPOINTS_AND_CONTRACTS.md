# Danh Sách API & Hợp Đồng Dữ Liệu (API Endpoints & Contracts)

Tài liệu này tổng hợp toàn bộ các API Endpoints thuộc hệ thống AI (Backend Express) và hợp đồng kiểu dữ liệu tương ứng phía Frontend (`aiApi.ts`).

---

## 1. Danh Sách RESTful API Endpoints (Backend Routes)

Tất cả các tuyến đường API AI đều có tiền tố `/api/ai` và yêu cầu xác thực JWT Bearer Token (`protectMiddleware`).

### 1.1 AI Chatbot & RAG (`aiChat.routes.js`)

| HTTP Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/ai/chat/sessions` | Student / Teacher | Tạo mới phiên trò chuyện AI Chat cho một bài giảng. |
| `POST` | `/api/ai/chat/sessions/:sessionId/messages` | Student / Teacher | Gửi câu hỏi cho AI Chatbot và nhận phản hồi RAG. |
| `GET` | `/api/ai/chat/sessions/:sessionId/messages` | Student / Teacher | Lấy danh sách lịch sử tin nhắn của phiên chat (phân trang). |

### 1.2 AI Tóm Tắt Bài Giảng (`aiSummary.routes.js`)

| HTTP Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `GET` | `/api/ai/lectures/:lessonId/summary` | Student / Teacher / Admin | Lấy bản tóm tắt bài giảng (Student: bản `approved`; Teacher: bản mới nhất). |
| `POST` | `/api/ai/lectures/:lessonId/summary` | Teacher / Admin | Yêu cầu AI sinh bản tóm tắt nháp (`draft`) cho bài giảng. |
| `PATCH` | `/api/ai/lectures/:lessonId/summary/:summaryId/approve` | Teacher / Admin | Duyệt bản tóm tắt nháp thành `approved`. |
| `PATCH` | `/api/ai/lectures/:lessonId/summary/:summaryId/reject` | Teacher / Admin | Từ chối bản tóm tắt nháp (`rejected`) kèm lý do. |

### 1.3 AI Sinh Bộ Câu Hỏi & Đề Thi (`aiQuestion.routes.js`)

| HTTP Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/ai/lectures/:lessonId/question-sets/generate` | Teacher / Admin | Sinh bộ câu hỏi tự động từ bài giảng và lưu vào ExamSet/Folder. |

### 1.4 AI Chấm Bài Tự Luận (`aiGrading.routes.js`)

| HTTP Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/ai/exam-attempts/:attemptId/questions/:questionId/grade-suggestion` | Teacher / Admin | Yêu cầu AI chấm và đưa ra gợi ý điểm/nhận xét cho câu hỏi tự luận. |
| `POST` | `/api/ai/exam-attempts/:attemptId/questions/:questionId/grade-confirmation` | Teacher / Admin | Giáo viên xác nhận điểm (`accept`, `adjust`, `reject`) và cập nhật điểm bài thi. |

### 1.5 AI Chỉ Mục Tri Thức RAG (`aiKnowledge.routes.js`)

| HTTP Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/ai/lessons/:lessonId/index` | Teacher / Admin | Yêu cầu lập chỉ mục Vector RAG cho bài giảng (hỗ trợ `force=true`). |
| `GET` | `/api/ai/lessons/:lessonId/knowledge-status` | Teacher / Admin | Xem trạng thái lập chỉ mục tri thức của bài giảng. |

---

## 2. Hợp Đồng Kiểu Dữ Liệu Frontend (`Frontend/src/api/aiApi.ts`)

### 2.1 Interface Chat & Citations
```typescript
export interface ICitation {
  chunkId: string;
  sourceName: string;
  sourceType: string;
  lessonId: string;
  excerpt?: string;
  score?: number;
}

export interface IChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  citations?: ICitation[];
  confidence?: number;
}

export interface AIChatSession {
  id: string;
  lessonId?: string;
  title?: string;
  messages?: IChatMessage[];
  createdAt?: string;
}
```

### 2.2 Interface Summary
```typescript
export type AISummaryStatus = "draft" | "approved" | "rejected" | "superseded";

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
}
```

### 2.3 Interface Question Generation
```typescript
export interface IQuestionGenerationOptions {
  folderId: string;
  title: string;
  questionCount: number;
  questionTypes: Record<string, number>;
  difficultyDistribution: Record<string, number>;
}

export interface IGeneratedQuestionSet {
  examSetId: string;
  lessonId: string;
  folderId?: string;
  title: string;
  status: string;
  questionCount: number;
  totalPoints: number;
  sourceWarnings?: string[];
}
```

---

## 3. Mã Lỗi Chuẩn Hóa (`AIError` & `AIErrorCode`)

Backend định nghĩa lớp `AIError` (`Backend/src/modules/ai/aiError.js`) trả về phản hồi HTTP nhất quán khi gặp sự cố:

```json
{
  "success": false,
  "error": {
    "code": "AI_QUOTA_EXCEEDED",
    "message": "Bạn đã sử dụng hết hạn mức AI trong ngày (30/30 lượt). Vui lòng thử lại vào ngày mai!",
    "details": {
      "todayUsageCount": 30,
      "dailyLimit": 30
    }
  }
}
```

### Danh sách Mã Lỗi (`AIErrorCode`):
- **`AI_CONFIG_ERROR`** (500): Thiếu API Key hoặc Atlas Vector Search Index chưa sẵn sàng.
- **`AI_QUOTA_EXCEEDED`** (429): Vượt quá hạn mức sử dụng AI trong ngày của người dùng.
- **`AI_FEATURE_DISABLED`** (403): Tính năng AI toàn hệ thống hoặc tính năng cụ thể đang bị khóa.
- **`AI_INVALID_INPUT`** (400/404): Tham số đầu vào rỗng, quá dài, hoặc bài học không tồn tại.
- **`AI_OUTPUT_INVALID`** (422): Phản hồi từ AI không đúng cấu trúc JSON mong đợi.
- **`AI_PROVIDER_ERROR`** (500/503): Lỗi kết nối tới Google Gemini API.
- **`AI_TIMEOUT`** (504): Quá thời gian chờ phản hồi AI (Mặc định 30s-60s).
