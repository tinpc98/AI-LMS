import { AIError, AIErrorCode } from "../aiError.js";
import { safeParseJSON } from "../parsers/outputParser.js";

const VALID_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

/**
 * Validate + làm sạch output đề xuất ôn tập từ AI.
 * Lọc bỏ mọi đề xuất có topicId không khớp danh sách điểm yếu thật (chống bịa dữ liệu).
 */
export const validateRecommendationOutput = (rawResponse, validTopicIds) => {
  const parsedData = safeParseJSON(rawResponse);

  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError("Dữ liệu đề xuất từ AI không hợp lệ", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  if (!Array.isArray(parsedData.recommendations)) {
    throw new AIError("recommendations phải là một mảng", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  const recommendations = parsedData.recommendations
    .filter((r) => r && typeof r.topicId === "string" && validTopicIds.includes(r.topicId))
    .map((r) => ({
      topicId: r.topicId,
      priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : "MEDIUM",
      reason:
        typeof r.reason === "string" && r.reason.trim()
          ? r.reason.trim()
          : "Không có giải thích chi tiết.",
    }));

  if (recommendations.length === 0) {
    throw new AIError(
      "AI không trả về đề xuất hợp lệ nào khớp với danh sách điểm yếu hiện tại",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  return {
    recommendations,
    explanation:
      typeof parsedData.explanation === "string" && parsedData.explanation.trim()
        ? parsedData.explanation.trim()
        : "Đề xuất học tập dựa trên phân tích điểm yếu.",
  };
};
