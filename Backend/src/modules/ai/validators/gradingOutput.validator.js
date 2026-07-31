import { AIError, AIErrorCode } from "../aiError.js";
import { safeParseJSON } from "../parsers/outputParser.js";

export const validateGradingOutput = (rawResponse, maxScore) => {
  const parsedData = safeParseJSON(rawResponse);

  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError("Dữ liệu chấm điểm từ AI không hợp lệ", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  // 1. Validate suggestedScore
  if (
    typeof parsedData.suggestedScore !== "number" ||
    !Number.isFinite(parsedData.suggestedScore)
  ) {
    throw new AIError("suggestedScore phải là một số hợp lệ", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }
  if (parsedData.suggestedScore < 0 || parsedData.suggestedScore > maxScore) {
    throw new AIError(
      `suggestedScore (${parsedData.suggestedScore}) vượt quá giới hạn (0 - ${maxScore})`,
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  // 2. Validate confidence
  if (typeof parsedData.confidence !== "number" || !Number.isFinite(parsedData.confidence)) {
    throw new AIError("confidence phải là một số hợp lệ", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }
  if (parsedData.confidence < 0 || parsedData.confidence > 1) {
    throw new AIError(
      "confidence phải nằm trong khoảng [0, 1]",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  // 3. Validate aiFeedback
  if (typeof parsedData.aiFeedback !== "string" || parsedData.aiFeedback.trim() === "") {
    throw new AIError("aiFeedback không được để trống", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }
  if (parsedData.aiFeedback.length > 2000) {
    throw new AIError(
      "aiFeedback quá dài (vượt quá 2000 ký tự)",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  let finalSuggestedScore = parsedData.suggestedScore;
  const warnings = Array.isArray(parsedData.warnings) ? [...parsedData.warnings] : [];
  if (parsedData.confidence < 0.6) {
    warnings.push("Confidence score thấp, giáo viên cần kiểm tra kỹ lại kết quả chấm.");
  }

  // 4. Validate criterionScores
  const criterionScores = [];
  if (Array.isArray(parsedData.criterionScores)) {
    let totalCriterionMax = 0;
    let totalCriterionEarned = 0;

    for (const [idx, item] of parsedData.criterionScores.entries()) {
      if (!item.criterion || typeof item.criterion !== "string") {
        throw new AIError(
          `Tiêu chí chấm điểm [${idx}] thiếu tên criterion`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502
        );
      }
      if (
        typeof item.scoreEarned !== "number" ||
        !Number.isFinite(item.scoreEarned) ||
        item.scoreEarned < 0
      ) {
        throw new AIError(
          `Tiêu chí [${item.criterion}] có scoreEarned không hợp lệ`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502
        );
      }
      if (
        typeof item.maxScore !== "number" ||
        !Number.isFinite(item.maxScore) ||
        item.maxScore <= 0
      ) {
        throw new AIError(
          `Tiêu chí [${item.criterion}] có maxScore không hợp lệ`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502
        );
      }
      if (item.scoreEarned > item.maxScore) {
        throw new AIError(
          `Tiêu chí [${item.criterion}] điểm đạt được (${item.scoreEarned}) lớn hơn điểm tối đa (${item.maxScore})`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502
        );
      }

      totalCriterionMax += item.maxScore;
      totalCriterionEarned += item.scoreEarned;

      criterionScores.push({
        criterion: item.criterion.trim(),
        scoreEarned: item.scoreEarned,
        maxScore: item.maxScore,
        feedback: typeof item.feedback === "string" ? item.feedback.trim() : "",
      });
    }

    if (totalCriterionMax > maxScore) {
      throw new AIError(
        `Tổng điểm các tiêu chí (${totalCriterionMax}) vượt quá tổng điểm câu hỏi (${maxScore})`,
        AIErrorCode.AI_OUTPUT_INVALID,
        502
      );
    }

    // AI-FIX-04: Đồng bộ điểm tổng nếu có sai lệch với tổng điểm thành phần
    if (Math.abs(totalCriterionEarned - finalSuggestedScore) > 0.01) {
      finalSuggestedScore = Number(totalCriterionEarned.toFixed(2));
      warnings.push(
        `Điểm đề xuất đã được tự động điều chỉnh thành ${finalSuggestedScore} để khớp với tổng điểm các tiêu chí.`
      );
    }
  }

  return {
    suggestedScore: finalSuggestedScore,
    confidence: parsedData.confidence,
    aiFeedback: parsedData.aiFeedback.trim(),
    criterionScores,
    warnings,
  };
};
