// Rào chắn: mọi endpoint AI gọi tới nhà cung cấp đều phải có ĐỦ rate limit và hạn mức.
//
// Test này duyệt router thật của Express thay vì kiểm từng route bằng tay. Lý do: chỗ hở của
// Wave 6 (POST .../knowledge/index) tồn tại lâu vì nó TRÔNG như một thao tác quản trị nội
// dung, trong khi thực chất nó gọi provider nhiều hơn mọi endpoint khác cộng lại. Không ai
// nhìn ra khi đọc route bằng mắt.
//
// Cách kiểm: Express giữ nguyên các hàm middleware trong router.stack. Hai middleware bảo vệ
// đã được đặt tên tường minh (`rateLimiter`, `aiQuotaGuard`) chính là để nhận diện ở đây.
import { describe, it, expect } from "vitest";

const knowledgeRoutes = (await import("#modules/ai/routes/aiKnowledge.routes.js")).default;
const chatRoutes = (await import("#modules/ai/routes/aiChat.routes.js")).default;
const gradingRoutes = (await import("#modules/ai/routes/aiGrading.routes.js")).default;
const questionRoutes = (await import("#modules/ai/routes/aiQuestion.routes.js")).default;
const summaryRoutes = (await import("#modules/ai/routes/aiSummary.routes.js")).default;

/** Tên các middleware gắn trên một route cụ thể của router. */
const middlewareNamesOf = (router, method, path) => {
  const layer = router.stack.find(
    (l) => l.route?.path === path && l.route?.methods?.[method.toLowerCase()]
  );
  if (!layer) throw new Error(`Không tìm thấy route ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((s) => s.handle.name);
};

// Bảng các endpoint THỰC SỰ gọi tới nhà cung cấp AI (tốn tiền và tốn quota).
// Endpoint không gọi provider (tạo phiên chat, duyệt/từ chối tóm tắt, xác nhận điểm, xem
// trạng thái index) cố ý KHÔNG nằm trong bảng này — bắt chúng qua hạn mức là tính nhầm lượt.
const ENDPOINT_GOI_AI = [
  ["lập chỉ mục kiến thức", knowledgeRoutes, "post", "/:lessonId/knowledge/index"],
  ["gửi tin nhắn chatbot", chatRoutes, "post", "/sessions/:sessionId/messages"],
  [
    "gợi ý chấm tự luận",
    gradingRoutes,
    "post",
    "/:attemptId/questions/:questionId/grade-suggestion",
  ],
  ["sinh tóm tắt bài học", summaryRoutes, "post", "/:lessonId/summary"],
  ["sinh bộ câu hỏi", questionRoutes, "post", "/generate"],
];

describe("Bảo vệ endpoint AI", () => {
  it.each(ENDPOINT_GOI_AI)("%s có rate limit", (_ten, router, method, path) => {
    expect(middlewareNamesOf(router, method, path)).toContain("rateLimiter");
  });

  it.each(ENDPOINT_GOI_AI)("%s có kiểm hạn mức", (_ten, router, method, path) => {
    expect(middlewareNamesOf(router, method, path)).toContain("aiQuotaGuard");
  });

  it("rate limit đứng TRƯỚC kiểm hạn mức", () => {
    // Thứ tự có ý nghĩa: rate limit chỉ đọc bộ nhớ tiến trình, còn kiểm hạn mức phải truy vấn
    // MongoDB. Đặt sau nghĩa là một kẻ spam vẫn ép được hệ thống truy vấn DB mỗi lần bấm.
    for (const [ten, router, method, path] of ENDPOINT_GOI_AI) {
      const names = middlewareNamesOf(router, method, path);
      expect(names.indexOf("rateLimiter"), ten).toBeLessThan(names.indexOf("aiQuotaGuard"));
    }
  });
});

describe("Endpoint KHÔNG gọi AI thì không tính vào hạn mức", () => {
  it.each([
    ["tạo phiên chat", chatRoutes, "post", "/sessions"],
    ["xem trạng thái lập chỉ mục", knowledgeRoutes, "get", "/:lessonId/knowledge/status"],
    [
      "xác nhận điểm do giáo viên chấm",
      gradingRoutes,
      "post",
      "/:attemptId/questions/:questionId/grade-confirmation",
    ],
  ])("%s không gắn kiểm hạn mức", (_ten, router, method, path) => {
    // Gắn nhầm hạn mức vào các endpoint này sẽ trừ lượt AI của người dùng cho những thao tác
    // không hề gọi AI — hết lượt oan.
    expect(middlewareNamesOf(router, method, path)).not.toContain("aiQuotaGuard");
  });
});
