import AIRecommendation from "./aiRecommendation.model.js";
import Weakness from "./weakness.model.js";
import { aiRecommendationService } from "#modules/ai";

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
  const weaknessContext = weaknesses.map((w) => ({
    topicId: w.topicId._id.toString(),
    topicName: w.topicId.name,
    severity: w.severity,
    accuracy: w.accuracy,
    attemptCount: w.attemptCount,
  }));

  let recommendations;

  try {
    // Gọi AI Core service thật qua public API của module ai (§5.2 — không thọc vào file nội bộ)
    recommendations = await aiRecommendationService.generateWeaknessRecommendation({
      userId: studentId,
      userRole: "student",
      weaknesses: weaknessContext,
      referenceId: courseId,
      referenceType: "Course",
    });
  } catch (aiError) {
    // Deterministic fallback when AI is unavailable
    console.warn(
      "AI service unavailable for recommendation, using deterministic fallback:",
      aiError.message
    );
    recommendations = {
      recommendations: weaknesses
        .sort((a, b) => a.accuracy - b.accuracy)
        .map((w) => ({
          topicId: w.topicId._id.toString(),
          priority: w.severity,
          reason: `Cần cải thiện độ chính xác (hiện tại ${w.accuracy}%) cho chủ đề ${w.topicId.name}`,
        })),
      explanation:
        "Đề xuất học tập tự động dựa trên phân tích điểm yếu. Ưu tiên các chủ đề có độ chính xác thấp nhất.",
    };
  }

  if (!recommendations.recommendations || recommendations.recommendations.length === 0) {
    throw new Error("Không tạo được đề xuất hợp lệ.");
  }

  const highestPriority = recommendations.recommendations[0]?.priority || "MEDIUM";

  const recDoc = await AIRecommendation.create({
    studentId,
    courseId,
    weaknessIds: weaknesses.map((w) => w._id),
    recommendedTopics: recommendations.recommendations.map((r) => r.topicId),
    explanation: recommendations.explanation,
    priority: highestPriority,
    status: "ACTIVE",
  });

  return recDoc;
};
