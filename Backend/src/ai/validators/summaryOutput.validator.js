import { AIError, AIErrorCode } from "../../utils/aiError.js";

export const summaryOutputValidator = (data) => {
  if (!data || typeof data !== "object") {
    throw new AIError("Output AI trả về không phải là JSON object hợp lệ.", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  let { summary, keyPoints, suggestedReviewTopics } = data;

  // Validate Summary
  if (!summary || typeof summary !== "string" || summary.trim().length === 0) {
    throw new AIError("Summary bị thiếu hoặc rỗng.", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }
  
  if (summary.length > 3000) {
    throw new AIError("Summary quá dài (vượt quá 3000 ký tự).", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  summary = summary.trim();

  // Validate Key Points
  if (!Array.isArray(keyPoints)) {
    throw new AIError("keyPoints không phải là mảng.", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  keyPoints = keyPoints.filter(kp => typeof kp === "string" && kp.trim().length > 0).map(kp => kp.trim());
  
  if (keyPoints.length === 0) {
    throw new AIError("keyPoints không được rỗng.", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  if (keyPoints.length > 20) {
    throw new AIError("keyPoints vượt quá số lượng cho phép (tối đa 20).", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  // Validate Suggested Review Topics
  if (suggestedReviewTopics !== undefined && !Array.isArray(suggestedReviewTopics)) {
    throw new AIError("suggestedReviewTopics không phải là mảng.", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  suggestedReviewTopics = (suggestedReviewTopics || []).filter(topic => typeof topic === "string" && topic.trim().length > 0).map(topic => topic.trim());

  if (suggestedReviewTopics.length > 15) {
    throw new AIError("suggestedReviewTopics vượt quá số lượng cho phép (tối đa 15).", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  return {
    summary,
    keyPoints,
    suggestedReviewTopics,
  };
};
