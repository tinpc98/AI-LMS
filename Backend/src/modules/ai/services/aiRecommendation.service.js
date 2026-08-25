import aiCoreService from "./aiCore.service.js";
import { validateRecommendationOutput } from "../validators/recommendationOutput.validator.js";

/**
 * Sinh đề xuất lộ trình ôn tập bằng AI dựa trên danh sách điểm yếu (Weakness) của học sinh.
 *
 * modules/performance gọi qua #modules/ai khi học sinh yêu cầu đề xuất ôn tập
 * (xem performance/recommendation.service.js). Hàm này không ghi DB — chỉ trả về dữ liệu
 * đề xuất đã được AI sinh ra và kiểm chứng; việc lưu AIRecommendation là trách nhiệm của caller.
 *
 * @param {Object} params
 * @param {string} params.userId - id người dùng dùng để tính quota AI (thường là studentId).
 * @param {string} [params.userRole="student"]
 * @param {Array<{topicId: string, topicName: string, severity: string, accuracy: number, attemptCount: number}>} params.weaknesses
 * @param {string} [params.referenceId]
 * @param {string} [params.referenceType]
 * @returns {Promise<{recommendations: Array, explanation: string}>}
 */
const generateWeaknessRecommendation = async ({
  userId,
  userRole = "student",
  weaknesses,
  referenceId = null,
  referenceType = null,
}) => {
  if (!Array.isArray(weaknesses) || weaknesses.length === 0) {
    throw new Error("weaknesses là bắt buộc và không được rỗng.");
  }

  const validTopicIds = weaknesses.map((w) => w.topicId);

  const aiResult = await aiCoreService.executeStructuredAI({
    userId,
    userRole,
    feature: "recommendation",
    templateName: "recommendation",
    promptParams: { weaknesses },
    referenceId,
    referenceType,
    validatorFunc: (data) => validateRecommendationOutput(data, validTopicIds),
  });

  return aiResult.data;
};

export default { generateWeaknessRecommendation };
