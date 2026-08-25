import AIRecommendation from "./aiRecommendation.model.js";
import Weakness from "./weakness.model.js";
import Topic from "../topic/topic.model.js";

/**
 * Generate AI-powered study recommendations based on student weaknesses.
 * Uses deterministic fallback when AI service is unavailable.
 */
export const generateRecommendationService = async (studentId, courseId) => {
  const weaknesses = await Weakness.find({ studentId, courseId })
    .populate("topicId", "name")
    .lean();

  if (!weaknesses || weaknesses.length === 0) {
    throw new Error("Không tìm thấy điểm yếu nào để đề xuất.");
  }

  // Build structured context for AI
  const weaknessContext = weaknesses.map(w => ({
    topicId: w.topicId._id.toString(),
    topicName: w.topicId.name,
    severity: w.severity,
    accuracy: w.accuracy,
    attemptCount: w.attemptCount,
  }));

  let recommendations;

  try {
    // Try to use AI Core service (Gemini)
    const aiCoreModule = await import("../ai/services/aiCore.service.js");
    const aiCoreService = aiCoreModule.default;

    const prompt = `
Bạn là AI chuyên gia giáo dục THPT Việt Nam.
Dưới đây là danh sách các Topic mà học sinh đang yếu:
${JSON.stringify(weaknessContext, null, 2)}

Hãy phân tích và trả về JSON đề xuất học tập theo định dạng:
{
  "recommendations": [
    {
      "topicId": "<ID của topic>",
      "priority": "HIGH" | "MEDIUM" | "LOW" | "CRITICAL",
      "reason": "Giải thích ngắn gọn lý do"
    }
  ],
  "explanation": "Đánh giá tổng quan"
}
Lưu ý: Chỉ trả về JSON hợp lệ, không có markdown formatting. topicId phải khớp chính xác với ID được cung cấp.
`;

    const result = await aiCoreService.execute("recommendation", {
      prompt,
      systemInstruction:
        "Bạn là AI chuyên phân tích điểm yếu học sinh và đưa ra lộ trình học tập tối ưu. Output JSON only.",
    });

    let cleanJson = (result.content || "")
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleanJson);

    // Validate topicIds
    const validTopicIds = weaknesses.map(w => w.topicId._id.toString());
    recommendations = {
      ...parsed,
      recommendations: (parsed.recommendations || []).filter(r =>
        validTopicIds.includes(r.topicId)
      ),
    };
  } catch (aiError) {
    // Deterministic fallback when AI is unavailable
    console.warn(
      "AI service unavailable for recommendation, using deterministic fallback:",
      aiError.message
    );
    recommendations = {
      recommendations: weaknesses
        .sort((a, b) => a.accuracy - b.accuracy)
        .map(w => ({
          topicId: w.topicId._id.toString(),
          priority: w.severity,
          reason: `Cần cải thiện độ chính xác (hiện tại ${w.accuracy}%) cho chủ đề ${w.topicId.name}`,
        })),
      explanation:
        "Đề xuất học tập tự động dựa trên phân tích điểm yếu. Ưu tiên các chủ đề có độ chính xác thấp nhất.",
    };
  }

  if (
    !recommendations.recommendations ||
    recommendations.recommendations.length === 0
  ) {
    throw new Error("Không tạo được đề xuất hợp lệ.");
  }

  const highestPriority =
    recommendations.recommendations[0]?.priority || "MEDIUM";

  const recDoc = await AIRecommendation.create({
    studentId,
    courseId,
    weaknessIds: weaknesses.map(w => w._id),
    recommendedTopics: recommendations.recommendations.map(r => r.topicId),
    explanation: recommendations.explanation,
    priority: highestPriority,
    status: "ACTIVE",
  });

  return recDoc;
};
