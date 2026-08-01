// File: src/modules/ai/ai.routes.js
// Gom toàn bộ sub-route của module AI về một chỗ (§2.1).
//
// Trước Wave 3.2, năm router AI được mount rải rác trong src/routes/index.js với năm
// tiền tố khác nhau, khiến sơ đồ URL của AI không nhìn được ở một chỗ. Nay composition
// root chỉ cần mount file này ở "/ai", còn cấu trúc bên dưới do module tự quyết.
//
// Đường dẫn cuối cùng KHÔNG đổi: các tiền tố dưới đây ghép với "/api/ai" cho ra đúng
// năm URL cũ.
import { Router } from "express";

import aiSummaryRoutes from "./routes/aiSummary.routes.js";
import aiQuestionRoutes from "./routes/aiQuestion.routes.js";
import aiGradingRoutes from "./routes/aiGrading.routes.js";
import aiKnowledgeRoutes from "./routes/aiKnowledge.routes.js";
import aiChatRoutes from "./routes/aiChat.routes.js";

const router = Router();

router.use("/lectures", aiSummaryRoutes);
router.use("/lectures/:lessonId/question-sets", aiQuestionRoutes);
router.use("/exam-attempts", aiGradingRoutes);
router.use("/lessons", aiKnowledgeRoutes);
router.use("/chat", aiChatRoutes);

export default router;
