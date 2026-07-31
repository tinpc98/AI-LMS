import { AIError, AIErrorCode } from "../aiError.js";

/**
 * Clean raw text from markdown code blocks
 * e.g., ```json { ... } ``` => { ... }
 */
export const cleanJsonString = (rawText) => {
  if (typeof rawText !== "string") return "";

  let cleaned = rawText.trim();
  // Strip markdown codeblock backticks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = cleaned.search(/[\}\]][^}]*$/);

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
};

/**
 * Safely parse JSON string with fallback cleaning
 */
export const safeParseJSON = (rawText) => {
  if (!rawText) {
    throw new AIError("Dữ liệu phản hồi từ AI rỗng!", AIErrorCode.AI_OUTPUT_INVALID, 502);
  }

  if (typeof rawText === "object") return rawText;

  try {
    return JSON.parse(rawText);
  } catch (firstErr) {
    const cleaned = cleanJsonString(rawText);
    try {
      return JSON.parse(cleaned);
    } catch (secondErr) {
      throw new AIError(
        `Không thể parse định dạng JSON từ phản hồi AI: ${secondErr.message}`,
        AIErrorCode.AI_OUTPUT_INVALID,
        502,
        { rawText }
      );
    }
  }
};

/**
 * Validate Summary Output Schema
 */
export const validateSummaryOutput = (parsedData) => {
  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError(
      "Dữ liệu summary AI không phải là object hợp lệ",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  if (
    !parsedData.summary ||
    typeof parsedData.summary !== "string" ||
    parsedData.summary.trim() === ""
  ) {
    throw new AIError(
      "AI Output thiếu trường 'summary' hoặc dữ liệu rỗng",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  return {
    summary: parsedData.summary.trim(),
    keyPoints: Array.isArray(parsedData.keyPoints)
      ? parsedData.keyPoints.map((k) => String(k).trim())
      : [],
    suggestedReviewTopics: Array.isArray(parsedData.suggestedReviewTopics)
      ? parsedData.suggestedReviewTopics.map((t) => String(t).trim())
      : [],
  };
};

/**
 * Validate Exam Generation Output Schema
 */
export const validateExamOutput = (parsedData, targetTotalPoints = 10.0) => {
  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError(
      "Dữ liệu sinh đề AI không phải object hợp lệ",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  if (!Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
    throw new AIError(
      "AI Output không chứa danh sách câu hỏi 'questions'",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  const validQuestions = [];
  let calculatedTotalPoints = 0;

  for (const [idx, q] of parsedData.questions.entries()) {
    if (!q.content || typeof q.content !== "string" || q.content.trim() === "") {
      throw new AIError(
        `Câu hỏi index [${idx}] thiếu nội dung (content)`,
        AIErrorCode.AI_OUTPUT_INVALID,
        502
      );
    }

    const type = String(q.type || "multiple_choice").toLowerCase();
    const points = typeof q.points === "number" && q.points > 0 ? q.points : 1.0;
    calculatedTotalPoints += points;

    if (type === "multiple_choice") {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new AIError(
          `Câu hỏi trắc nghiệm [${idx}] phải có tối thiểu 2 đáp án (options)`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502
        );
      }

      // Ensure option IDs
      const options = q.options.map((opt, oIdx) => ({
        id: opt.id ? String(opt.id).trim() : `opt_${oIdx + 1}`,
        text: opt.text ? String(opt.text).trim() : String(opt).trim(),
      }));

      // Ensure correctAnswer exists in option IDs
      let correctAnswer = q.correctAnswer ? String(q.correctAnswer).trim() : "";
      const matchOpt = options.find((o) => o.id === correctAnswer || o.text === correctAnswer);
      if (matchOpt) {
        correctAnswer = matchOpt.id; // Normalize to option ID
      } else {
        correctAnswer = options[0].id; // Fallback to first option to avoid invalid state
      }

      validQuestions.push({
        type: "multiple_choice",
        content: q.content.trim(),
        options,
        correctAnswer,
        points,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
        explanation: q.explanation ? String(q.explanation).trim() : "",
      });
    } else {
      // Essay question
      const rubric = Array.isArray(q.rubric)
        ? q.rubric.map((r) => ({
            criterion: String(r.criterion || "Tiêu chí").trim(),
            maxScore: typeof r.maxScore === "number" ? r.maxScore : 1.0,
          }))
        : [];

      validQuestions.push({
        type: "essay",
        content: q.content.trim(),
        points,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
        rubric,
      });
    }
  }

  return {
    title: parsedData.title ? String(parsedData.title).trim() : "Bộ đề thi AI",
    description: parsedData.description ? String(parsedData.description).trim() : "",
    questions: validQuestions,
    totalPoints: Number(calculatedTotalPoints.toFixed(2)),
  };
};

/**
 * Validate Grading Output Schema
 */
export const validateGradingOutput = (parsedData, maxAllowedScore = 10.0) => {
  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError(
      "Dữ liệu chấm bài AI không phải object hợp lệ",
      AIErrorCode.AI_OUTPUT_INVALID,
      502
    );
  }

  let suggestedScore =
    typeof parsedData.suggestedScore === "number" ? parsedData.suggestedScore : 0;
  if (suggestedScore < 0) suggestedScore = 0;
  if (suggestedScore > maxAllowedScore) suggestedScore = maxAllowedScore;

  const confidence =
    typeof parsedData.confidence === "number"
      ? Math.min(Math.max(parsedData.confidence, 0), 1)
      : 0.8;

  return {
    suggestedScore: Number(suggestedScore.toFixed(2)),
    confidence,
    aiFeedback: parsedData.aiFeedback ? String(parsedData.aiFeedback).trim() : "Không có nhận xét.",
    criterionScores: Array.isArray(parsedData.criterionScores)
      ? parsedData.criterionScores.map((c) => ({
          criterion: String(c.criterion || "Tiêu chí").trim(),
          scoreEarned: typeof c.scoreEarned === "number" ? Number(c.scoreEarned.toFixed(2)) : 0,
          maxScore: typeof c.maxScore === "number" ? Number(c.maxScore.toFixed(2)) : 0,
          feedback: c.feedback ? String(c.feedback).trim() : "",
        }))
      : [],
  };
};
