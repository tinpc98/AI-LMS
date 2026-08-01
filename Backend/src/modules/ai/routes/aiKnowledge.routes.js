import express from "express";
import { indexLessonKnowledge, getIndexStatus } from "../controllers/aiKnowledge.controller.js";
import { checkAILessonAccess } from "../middlewares/aiLessonAccess.middleware.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { checkAIQuota } from "../middlewares/aiQuota.middleware.js";
import { createRateLimiter } from "#shared/middlewares/rateLimit.middleware.js";
import { AIErrorCode } from "../aiError.js";

// Router is mounted at /api/ai/lessons
const router = express.Router({ mergeParams: true });

// Giới hạn CHẶT hơn các tính năng AI khác (3 request / 10 phút thay vì 5 / phút).
//
// Vì sao chặt hơn: một request lập chỉ mục sinh embedding cho TOÀN BỘ nội dung bài học, chia
// lô 3 chunk mỗi lần gọi provider. Một bài giảng dài có thể là hàng chục lượt gọi cho MỘT
// request — trong khi tóm tắt hay chấm bài chỉ là một lượt. Đếm request như nhau cho hai loại
// việc lệch nhau cả bậc độ lớn là không đúng.
//
// Cửa sổ 10 phút cũng hợp với cách dùng thật: giáo viên lập chỉ mục một bài học một lần, rồi
// chỉ chạy lại khi sửa nội dung. Bấm dồn dập chỉ có thể là nhầm hoặc lạm dụng.
const aiKnowledgeIndexRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user.id || req.user._id,
  code: AIErrorCode.AI_RATE_LIMIT_EXCEEDED,
  message:
    "Bạn đã gửi quá nhiều yêu cầu lập chỉ mục bài học. Đây là tác vụ nặng, vui lòng thử lại sau 10 phút.",
});

// S6: Index lesson knowledge (Only Teacher/Admin)
//
// TRƯỚC WAVE 6 ENDPOINT NÀY KHÔNG CÓ CHẶN NÀO. Đây là chỗ hở DUY NHẤT còn lại trong module
// ai — bốn tính năng kia (chat, chấm bài, sinh câu hỏi, tóm tắt) đều đã có đủ rate limit và
// hạn mức từ trước. Nó lọt lưới có lẽ vì trông giống một thao tác quản trị nội dung, trong
// khi thực chất nó gọi provider nhiều hơn mọi endpoint khác cộng lại.
router.post(
  "/:lessonId/knowledge/index",
  verifyUser,
  isTeacher,
  checkAILessonAccess, // Đảm bảo thuộc lớp mình dạy
  aiKnowledgeIndexRateLimit,
  checkAIQuota("knowledge-index"),
  indexLessonKnowledge
);

// S6: Get Index Status
router.get(
  "/:lessonId/knowledge/status",
  verifyUser,
  isTeacher,
  checkAILessonAccess,
  getIndexStatus
);

export default router;
