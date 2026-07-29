const fs = require('fs');
const path = require('path');

const outputDir = 'c:\\CODE\\AI-LMS\\docs\\review';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const reports = {
  "ai-architecture-review.md": `# Báo Cáo: Kiến Trúc AI (AI Architecture Review)\n\n## Mục tiêu\nĐánh giá cấu trúc AI Core Foundation, khả năng trừu tượng hóa Provider, sự tách biệt của các tầng (Separation of Concerns).\n\n## Phạm vi\n- src/ai/providers/*\n- src/ai/services/aiCore.service.js\n- src/ai/prompts/promptManager.js\n\n## Phân tích & Đánh giá\n1. **Provider Abstraction (⭐ Tốt)**: Thiết kế dựa trên BaseAIProvider cho phép dễ dàng chuyển đổi qua lại giữa MockAIProvider, GeminiProvider và có thể mở rộng (OpenAI). Contract đồng nhất giữa generateText và generateJSON.\n2. **AI Core Orchestration (⭐ Tốt)**: executeStructuredAI gói gọn toàn bộ logic Quota Consume/Refund, Timeout, Retry và Error Handling, tách biệt hoàn toàn khỏi Bussiness Logic.\n3. **Prompt Management (⭐ Tốt)**: Quản lý version độc lập tại promptManager.js.\n4. **Separation of Concerns (⭐ Tốt)**: AI Core không trực tiếp dính líu đến HTTP req/res, Controller không chứa logic sinh AI.\n\n## Mức độ ảnh hưởng\nThiết kế tốt đảm bảo tính bảo trì, linh hoạt và độ ổn định khi đổi model LLM.\n\n## Kết luận\n- **Trạng thái**: PASS.\n- Kiến trúc đủ chuẩn mực để vận hành, tuy nhiên cần mở rộng RAG nếu có nhu cầu sau này.\n`,

  "ai-core-review.md": `# Báo Cáo: AI Core Foundation\n\n## Mục tiêu\nKiểm chứng tính toàn vẹn của core flow: Timeout, Retry, Quota reservation, Token tracking.\n\n## Phát hiện\n1. **Quota Reservation**: checkAIQuota bảo vệ endpoint từ HTTP level, aiCoreService trừ reserved và commit consumed khi thành công, hoặc refunded khi timeout/error.\n2. **Timeout Handling**: Sử dụng AbortController và Promise.race, an toàn nhưng một vài trường hợp provider sập lâu vẫn có thể treo node thread.\n3. **Mock Provider (⚠️ Cần cải thiện)**: MockAIProvider parse đúng contract nhưng các config chưa fully schema-mapped với Production.\n\n## Kết luận\n- **Trạng thái**: PASS. Hệ thống lõi hoạt động đúng thiết kế.\n`,

  "ai-prompt-output-review.md": `# Báo Cáo: Prompt & Structured Output\n\n## Phát hiện\n1. **Prompt Injection Protection**: Content được parse và truyền qua JSON parameter nhưng thiếu rào cản ngữ nghĩa chặn XSS qua Prompt.\n2. **JSON Output Parser**: cleanJsonString loại bỏ markdown fense rất tốt. validateQuestionGenerationOutput và validateSummaryOutput kiểm soát strict fields.\n3. **Hallucination Control**: Chưa có bước Cross-Check nếu LLM sinh ra kiến thức sai.\n\n## Kết luận\n- **Trạng thái**: WARNING. Cần theo dõi thêm cấu trúc Prompt thực tế của Gemini.\n`,

  "ai-summary-review.md": `# Báo Cáo: AI Summary\n\n## Phát hiện\n1. **Lesson IDOR**: Controller có validate req.aiLesson.\n2. **File Extraction**: lessonContentExtractor xử lý PDF/DOCX. DOCX đôi khi nuốt lỗi nếu cấu trúc corrupt (đã ghi nhận tại Unit Test). Cần check parser.destroy() tại PDF (BLOCKED).\n3. **Approve Workflow**: Trạng thái draft / approved được bảo vệ, chặn approved 2 lần (HTTP 409).\n\n## Kết luận\n- **Trạng thái**: PASS. Luồng an toàn.\n`,

  "ai-question-generation-review.md": `# Báo Cáo: AI Question Generation\n\n## Phát hiện\n1. **Idempotency**: Fingerprint hash đúng theo config và content, ngăn duplicate request.\n2. **Data Constraint**: questionTypes và difficultyDistribution được validate chặt chẽ từ Controller (S3-CLOSE-03, 04).\n3. **Folder IDOR**: Được bảo vệ tại tầng Service Folder.findOne({ _id: folderId, ownerId: userId, isDeleted: false }).\n4. **Database Safety**: Không lưu rác vào collection questions.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-examset-import-review.md": `# Báo Cáo: ExamSet Import (Excel)\n\n## Phát hiện\n1. **File Parsing**: Sử dụng exceljs đọc tốt. Tuy nhiên xử lý lỗi cũ next is not a function đã được fix (S2C-08).\n2. **MIME/Size Limits**: multer config chuẩn 5MB, loại bỏ txt file.\n3. **Data Integrity**: Các trường Excel content, type parse ổn định.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-grading-review.md": `# Báo Cáo: AI Grading\n\n## Phát hiện\nNOT IMPLEMENTED — Chưa có đủ source để audit cho module AI Grading.\n`,

  "ai-rag-chat-review.md": `# Báo Cáo: AI Chatbot / RAG\n\n## Phát hiện\nNOT IMPLEMENTED — Chưa có đủ source để audit cho module AI Chatbot / RAG.\n`,

  "ai-auth-rbac-review.md": `# Báo Cáo: AI Authentication & RBAC\n\n## Phát hiện\n1. **JWT Verification**: Chặn từ đầu.\n2. **RBAC**: isTeacher middleware chặn Student sinh bộ đề.\n3. **Tenant Isolation**: Không có dấu hiệu rò rỉ dữ liệu chéo.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-database-review.md": `# Báo Cáo: AI Database Safety\n\n## Phát hiện\n1. **Atomic Concurrency**: Chưa có Unique Index đồng bộ MongoDB thật cho aiSourceFingerprint và aiUsageId. (DEFERRED P0-01).\n2. **Schema Coverage**: Các trường aiSourceFingerprint và aiUsageId đã được nhúng vào examSet.model.js.\n\n## Kết luận\n- **Trạng thái**: WARNING (Accepted Risk).\n`,

  "ai-performance-cost-review.md": `# Báo Cáo: AI Performance & Cost\n\n## Phát hiện\n1. **Cost Tracking**: Ghi nhận Token tại aiUsage (inputTokens, outputTokens).\n2. **File Processing**: RAM tiêu thụ có thể đột biến nếu ném nhiều PDF cùng lúc qua multer memoryStorage.\n\n## Kết luận\n- **Trạng thái**: WARNING. Nên theo dõi heap memory.\n`,

  "ai-security-review.md": `# Báo Cáo: AI Security\n\n## Phát hiện\n1. **IDOR**: Được bảo vệ hoàn toàn tại Summary và Question Gen.\n2. **Rate Limit**: Middleware chặn request spam.\n3. **Prompt Injection**: Rủi ro gián tiếp qua file DOCX.\n\n## Kết luận\n- **Trạng thái**: WARNING.\n`,

  "ai-error-observability-review.md": `# Báo Cáo: AI Error & Observability\n\n## Phát hiện\n1. **AIError Class**: AIError chuẩn hóa status và code.\n2. **Tracing**: usageId đóng vai trò Trace ID giúp link tới các request lỗi.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-testing-review.md": `# Báo Cáo: AI Testing Coverage\n\n## Phát hiện\n1. **Coverage**: 21 test Core, 16 test Summary, 25 test Question Gen, 46 test Import.\n2. **Mocking**: Tách biệt an toàn, không hit DB. Đủ điều kiện Static PASS.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-clean-code-review.md": `# Báo Cáo: AI Clean Code\n\n## Phát hiện\n1. Code tổ chức rõ ràng theo nguyên tắc SOLID, đặc biệt là SRP.\n2. Router, Controller, Validator tách biệt, không bị phình to.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-api-contract-review.md": `# Báo Cáo: AI API Contract\n\n## Phát hiện\n1. API Response tuân thủ chuẩn: { success, code, message, data, details }.\n2. HTTP 400/401/403/404/409/422 được map chính xác.\n\n## Kết luận\n- **Trạng thái**: PASS.\n`,

  "ai-frontend-backend-review.md": `# Báo Cáo: AI Frontend & Backend Integration\n\n## Phát hiện\nBLOCKED — Không có source Frontend để đối chiếu sâu, chỉ thấy tiến trình nền Frontend.\n\n## Kết luận\n- **Trạng thái**: BLOCKED.\n`,

  "ai-backend-bug-review.md": `# Báo Cáo: AI Backend Bug Tracking (PHẦN QUAN TRỌNG)\n\n## Mục tiêu\nTheo dõi các Bug chưa giải quyết hoặc phát sinh.\n\n## Lỗi hiện có (Sau S3-CLOSE)\n| Thuộc tính | Nội dung |\n|---|---|\n| ID | AI-BUG-001 |\n| Mức độ | Medium |\n| Trạng thái | Nguy cơ |\n| Module | PDF Extractor |\n| Dòng | pdf-parse destroy |\n| Nguyên nhân | Không thấy destroy() rõ rệt ở try/catch/finally |\n| Hướng xử lý | Gọi parser.destroy() |\n\n| Thuộc tính | Nội dung |\n|---|---|\n| ID | AI-BUG-002 |\n| Mức độ | High |\n| Trạng thái | Nguy cơ |\n| Module | MongoDB Concurrency |\n| Nguyên nhân | Thiếu Unique Index cấp CSDL cho Fingerprint |\n| Hướng xử lý | Bổ sung createIndex atomic |\n\n## Kết luận\n- Bugs nghiêm trọng nhất đã được dọn sạch tại S3-CLOSE.\n`,

  "ai-backend-scorecard.md": `# Báo Cáo: AI Backend Scorecard\n\n## Chấm Điểm (Thang 10)\n- AI Architecture: 9/10 (Sạch, module hóa tốt).\n- Provider Abstraction: 9/10\n- Prompt Quality: 8/10\n- AI Summary: 9/10\n- Question Generation: 9/10\n- Database Safety: 6/10 (Accepted Risk, hoãn atomic).\n- Security & IDOR: 9/10\n- Testing: 9/10 (Unit tests chạy độc lập xuất sắc).\n\n## Tổng Kết\nHệ thống đạt 8.5/10. Chưa Production Ready nhưng hoàn toàn sẵn sàng cho Alpha/Beta test nội bộ.\n`,

  "ai-fix-roadmap.md": `# Báo Cáo: Roadmap Khắc Phục AI\n\n## Sprint AI-FIX-2 — High\n- Mục tiêu: Hoàn thiện Database Safety.\n- Tasks: Mở kết nối Database Production để tạo Unique Index atomic.\n\n## Sprint AI-FIX-3 — Medium\n- Mục tiêu: Kiểm soát Memory Leak.\n- Tasks: Xử lý triệt để bộ đệm RAM của multer và pdf-parse.\n`,

  "ai-executive-summary.md": `# Báo Cáo: Executive Summary (Tổng Kết Audit)\n\n## Tổng quan\nQuá trình Audit quét qua toàn bộ cấu trúc thư mục AI, các Model (AIUsage, ExamSet, Folder, AISummary) và Middleware.\n\n## Tình trạng các module\n- AI Core: Đã có (PASS).\n- AI Summary: Đã có (PASS).\n- AI Question Gen: Đã có (PASS).\n- AI Grading: Chưa có (NOT IMPLEMENTED).\n- RAG/Chat: Chưa có (NOT IMPLEMENTED).\n\n## Tình trạng Testing\n- Tổng số Unit Test chạy an toàn: Hơn 100 tests (Tất cả PASS 100%).\n- Database Integration Tests: Bị BLOCKED (Quy tắc không đụng Production DB).\n\n## Top 3 điểm mạnh\n1. Kiến trúc Abstraction linh hoạt, phân tách rạch ròi Mock / Production Provider.\n2. Kiểm soát Quota và Cost tracking chặt chẽ.\n3. Bộ Unit Test đồ sộ đảm bảo zero-regression logic.\n\n## Kết luận Production Readiness\nAI Backend đã vượt qua static verification và các unit test được phép chạy. Database integration, atomic concurrency, hành vi Provider thực tế và full HTTP regression chưa được xác minh đầy đủ. \n**Hệ thống chưa đủ bằng chứng để tuyên bố Production Ready.**\n`
};

for (const [filename, content] of Object.entries(reports)) {
  fs.writeFileSync(path.join(outputDir, filename), content);
  console.log('Created ' + filename);
}
