# Tài Liệu Hệ Thống AI (AI Feature Documentation)

Hệ thống AI-LMS tích hợp các tính năng Trí tuệ nhân tạo (AI) hiện đại dựa trên mô hình ngôn ngữ lớn (LLM - Google Gemini / Mock Provider) và công nghệ **RAG (Retrieval-Augmented Generation)** sử dụng **MongoDB Atlas Vector Search**.

Thư mục `docs/ai/` chứa toàn bộ tài liệu kiểm tra, phân tích kiến trúc và chi tiết vận hành các tính năng AI trong toàn bộ dự án.

---

## 📂 Danh Mục Tài Liệu

1. [**Kiến Trúc Tổng Quan & AI Core (OVERVIEW_AND_ARCHITECTURE.md)**](./OVERVIEW_AND_ARCHITECTURE.md)
   - Phân tích kiến trúc AI Core Orchestration, Provider Layer (Gemini / Mock).
   - Cơ chế RAG Vector Search & Embedding Pipeline.
   - Quản lý Quota, Rate-limit, Feature Flags & Chi phí (AIUsage).
   - An toàn dữ liệu, Bảo mật Prompt Injection & Input Budgeting.

2. [**Chi Tiết Các Tính Năng AI (FEATURES_SPECIFICATION.md)**](./FEATURES_SPECIFICATION.md)
   - **AI Chatbot (RAG Assistant)**: Trợ lý học tập theo ngữ cảnh bài giảng, trích dẫn tài liệu.
   - **AI Lesson Summary**: Tóm tắt nội dung bài giảng, trích xuất điểm chính & quy trình duyệt (Workflow).
   - **AI Question Generation**: Tự động sinh bộ câu hỏi / đề thi từ tài liệu bài học.
   - **AI Essay Grading**: Hỗ trợ chấm câu hỏi tự luận, đề xuất điểm & nhận xét cho giáo viên.
   - **AI Knowledge Indexing**: Trích xuất & chỉ mục dữ liệu tri thức (PDF, DOCX, Lesson Text).
   - **AI Management Console**: Bảng điều khiển quản trị hệ thống AI cho Admin.

3. [**Danh Sách API & Hop Đồng Dữ Liệu (API_ENDPOINTS_AND_CONTRACTS.md)**](./API_ENDPOINTS_AND_CONTRACTS.md)
   - Tổng hợp toàn bộ RESTful API endpoints cho các dịch vụ AI.
   - Schema Request / Response, Error Codes (`AIError`), và Frontend API Client (`aiApi.ts`).

4. [**Hướng Dẫn Vận Hành & Cấu Hình RAG (OPERATIONAL_GUIDE_AND_RAG.md)**](./OPERATIONAL_GUIDE_AND_RAG.md)
   - Cấu hình MongoDB Atlas Vector Search Index (`ai_knowledge_vector_index`).
   - Danh sách biến môi trường (`.env`).
   - Quy trình re-indexing, kiểm tra tính nhất quán (`embeddingDimensions`) và khắc phục sự cố.

---

## 🛠 Bản Tóm Tắt Nhanh Thành Phần Code (Code Mapping)

| Thành Phần | Backend Path | Frontend Path |
|---|---|---|
| **AI Core & Provider** | `Backend/src/modules/ai/services/aiCore.service.js` | `Frontend/src/api/aiApi.ts` |
| **AI Chatbot RAG** | `Backend/src/modules/ai/services/aiChat.service.js` | `Frontend/src/features/ai/components/AIChatWidget.tsx` |
| **AI Summary** | `Backend/src/modules/ai/services/aiSummary.service.js` | `Frontend/src/features/learning/` |
| **AI Question Gen** | `Backend/src/modules/ai/services/aiQuestionGeneration.service.js` | `Frontend/src/features/exam-set/` |
| **AI Essay Grading** | `Backend/src/modules/ai/services/aiGrading.service.js` | `Frontend/src/features/grade/` |
| **RAG & Indexing** | `Backend/src/modules/ai/services/aiKnowledgeIndexing.service.js` | `Frontend/src/features/ai/components/KnowledgeTable.tsx` |
| **Quota & Usage** | `Backend/src/modules/ai/services/aiUsage.service.js` | `Frontend/src/features/ai/components/AIDashboard.tsx` |
| **Admin Console** | `Backend/src/modules/ai/models/aiConfig.model.js` | `Frontend/src/features/ai/AIManagementPage.tsx` |
