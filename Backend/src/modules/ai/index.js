// File: src/modules/ai/index.js
// PUBLIC API của module ai (§3.3).
//
// Đây là module lớn nhất (50 file). Bên trong giữ nguyên cấu trúc phân tầng sẵn có
// (services/ prompts/ providers/ parsers/ validators/ utils/ models/ controllers/
// routes/ middlewares/) — việc tái lát nó thành các miền con chat/grading/summary/
// knowledge như §2.1 phác thảo là RE-SLICE, không phải di chuyển, nên để Wave 4.
//
// Bề mặt public cố ý rất hẹp so với 50 file bên trong: chỉ 4 thứ mà bên ngoài thật sự
// cần. Mọi thứ còn lại là nội bộ.
//
// ai.routes.js không export ở đây — composition root trỏ thẳng vào nó, theo nguyên tắc
// đã chốt ở Wave 3.4 (index.js không re-export thứ mà file nội bộ module cũng cần).

// server.js gọi lúc khởi động: đồng bộ cấu hình AIConfig và cảnh báo lệch cấu hình RAG.
export { default as aiUsageService } from "./services/aiUsage.service.js";
export { default as aiKnowledgeIndexingService } from "./services/aiKnowledgeIndexing.service.js";

// modules/exam gọi khi giáo viên sinh đề thi bằng AI.
export { default as aiExamGenerationService } from "./services/aiExamGeneration.service.js";

// Lớp lỗi riêng của AI. modules/class dùng trong classAuth.helper để ném lỗi cùng khuôn
// mẫu; cron job aiPendingRecovery cũng bắt theo loại này.
export * from "./aiError.js";
