import crypto from "crypto";
import AIGradingSuggestion from "../../models/aiGradingSuggestion.model.js";
import ExamAttempt from "../../models/examAttempt.model.js";
import aiCoreService from "./aiCore.service.js";
import aiUsageService from "./aiUsage.service.js";
import { resolveExamQuestions } from "../../utils/examQuestionResolver.js";
import { gradingPromptTemplate } from "../prompts/grading.prompt.js";
import { validateGradingOutput } from "../validators/gradingOutput.validator.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";
import { AIInputBudget } from "../utils/aiInputBudget.js";

const deepCanonicalize = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepCanonicalize);
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = deepCanonicalize(obj[key]);
      return acc;
    }, {});
};

const generateFingerprint = (payload) => {
  // S5.5-06: Deep Canonicalize object trước khi hash
  const canonicalString = JSON.stringify(deepCanonicalize(payload));
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
};

/**
 * Tạo đề xuất chấm điểm từ AI
 */
const generateGradeSuggestion = async ({ attemptId, questionId, teacherId }) => {
  // 1. Kiểm tra bài làm
  const attempt = await ExamAttempt.findById(attemptId).populate("examId");
  if (!attempt) {
    throw new AIError("Phiên làm bài không tồn tại", AIErrorCode.AI_INVALID_INPUT, 404);
  }

  // 2. Lấy thông tin câu hỏi
  const exam = attempt.examId;
  const questionMap = await resolveExamQuestions(exam, [questionId]);
  const questionInfo = questionMap.get(questionId);

  if (!questionInfo) {
    throw new AIError("Câu hỏi không tồn tại trong đề thi", AIErrorCode.AI_INVALID_INPUT, 404);
  }

  const qType = questionInfo.type?.toLowerCase();
  if (qType !== "essay" && qType !== "short_answer") {
    throw new AIError(
      "Chỉ hỗ trợ AI chấm điểm câu hỏi tự luận (Essay / Short Answer)",
      AIErrorCode.AI_INVALID_INPUT,
      400
    );
  }

  // 3. Lấy câu trả lời của học sinh
  const studentAnswerObj = attempt.answers.find(
    (ans) => ans.questionId && ans.questionId.toString() === questionId
  );

  if (!studentAnswerObj) {
    throw new AIError("Học sinh chưa trả lời câu hỏi này", AIErrorCode.AI_INVALID_INPUT, 404);
  }

  const studentText = studentAnswerObj.essayText || studentAnswerObj.selectedOption || "";

  // 4. Tạo fingerprint để kiểm tra tính Idempotency
  const maxScore = questionInfo.points || 1;
  const promptData = {
    questionContent: questionInfo.content,
    questionType: qType,
    studentAnswer: studentText,
    referenceAnswer: questionInfo.suggestedAnswer || questionInfo.correctAnswer || "",
    rubric: questionInfo.rubric || null,
    maxScore,
    language: "vi", // Hoặc lấy từ thiết lập của bài thi nếu có
  };

  // Validate budgets for Grading
  AIInputBudget.validateGradingBudget(promptData.studentAnswer, "Bài làm của học sinh");
  AIInputBudget.validateGradingBudget(promptData.referenceAnswer, "Đáp án tham khảo");
  if (promptData.rubric) {
    AIInputBudget.validateGradingBudget(
      JSON.stringify(promptData.rubric),
      "Tiêu chí chấm điểm (Rubric)"
    );
  }

  const fingerprintPayload = {
    attemptId,
    questionId,
    questionType: qType,
    studentText,
    referenceAnswer: promptData.referenceAnswer,
    rubric: promptData.rubric,
    maxScore,
    promptVersion: "1.0", // Hoặc có thể lấy từ config
  };
  const fingerprint = generateFingerprint(fingerprintPayload);

  // Kiểm tra xem đã có suggestion nào cho cùng dữ liệu này chưa
  const existingSuggestion = await AIGradingSuggestion.findOne({
    sourceFingerprint: fingerprint,
  });

  if (existingSuggestion) {
    return existingSuggestion; // Trả về kết quả cũ nếu dữ liệu không đổi
  }

  // 5. Gọi AI Core service
  const aiResult = await aiCoreService.executeStructuredAI({
    userId: teacherId,
    userRole: "teacher",
    feature: "grading",
    templateName: "grading",
    promptParams: promptData,
    referenceId: attemptId,
    referenceType: "ExamAttempt",
    validatorFunc: (data) => validateGradingOutput(data, maxScore),
  });

  const validatedData = aiResult.data;
  const aiUsageId = aiResult.usageId || null;

  // 7. Lưu lại kết quả đề xuất (Không ghi trực tiếp vào ExamAttempt)
  const suggestion = new AIGradingSuggestion({
    attemptId,
    questionId,
    suggestedScore: validatedData.suggestedScore,
    confidence: validatedData.confidence,
    aiFeedback: validatedData.aiFeedback,
    criterionScores: validatedData.criterionScores,
    warnings: validatedData.warnings,
    model: aiResult.usage?.model || "unknown",
    promptVersion: "1.0",
    sourceFingerprint: fingerprint,
    aiUsageId,
    generatedBy: teacherId,
    status: "PENDING_REVIEW",
  });

  await suggestion.save();

  return suggestion;
};

/**
 * Giáo viên xác nhận điểm (Accept/Adjust/Reject)
 */
const confirmGradeSuggestion = async ({
  suggestionId,
  attemptId,
  questionId,
  action,
  finalScore,
  teacherFeedback,
  teacherId,
}) => {
  const suggestion = await AIGradingSuggestion.findById(suggestionId);
  if (!suggestion) {
    throw new AIError("Không tìm thấy kết quả đề xuất AI", AIErrorCode.AI_INVALID_INPUT, 404);
  }

  // S5-FIX-06: URL Bind Verification
  if (suggestion.attemptId.toString() !== attemptId.toString()) {
    throw new AIError(
      "Suggestion này không thuộc về phiên làm bài được yêu cầu",
      AIErrorCode.AI_INVALID_INPUT,
      400
    );
  }

  if (suggestion.questionId.toString() !== questionId.toString()) {
    throw new AIError(
      "Suggestion này không thuộc về câu hỏi được yêu cầu",
      AIErrorCode.AI_INVALID_INPUT,
      400
    );
  }

  if (suggestion.status !== "PENDING_REVIEW") {
    throw new AIError(
      "Gợi ý này đã được duyệt hoặc bị thay thế",
      AIErrorCode.AI_INVALID_INPUT,
      409
    );
  }

  const attempt = await ExamAttempt.findById(suggestion.attemptId).populate("examId");
  if (!attempt) {
    throw new Error("Phiên làm bài không tồn tại");
  }

  const exam = attempt.examId;
  const questionMap = await resolveExamQuestions(exam, [suggestion.questionId.toString()]);
  const questionInfo = questionMap.get(suggestion.questionId.toString());

  if (!questionInfo) {
    throw new Error("Câu hỏi không tồn tại trong đề thi");
  }

  const maxScore = questionInfo.points || 1;
  const answerIndex = attempt.answers.findIndex(
    (a) => a.questionId && a.questionId.toString() === suggestion.questionId.toString()
  );

  if (answerIndex === -1) {
    throw new AIError(
      "Học sinh không trả lời câu hỏi này, không thể ghi điểm",
      AIErrorCode.AI_INVALID_INPUT,
      400
    );
  }

  const previousPointsEarned = attempt.answers[answerIndex].pointsEarned || 0;
  let pointsToAward = previousPointsEarned;

  if (action === "accept") {
    pointsToAward = suggestion.suggestedScore;
  } else if (action === "adjust") {
    if (
      typeof finalScore !== "number" ||
      !Number.isFinite(finalScore) ||
      finalScore < 0 ||
      finalScore > maxScore
    ) {
      throw new AIError(
        `Điểm xác nhận (${finalScore}) không hợp lệ (0 - ${maxScore})`,
        AIErrorCode.AI_INVALID_INPUT,
        400
      );
    }
    pointsToAward = finalScore;
  }

  if (action === "accept" || action === "adjust") {
    attempt.answers[answerIndex].pointsEarned = pointsToAward;

    // Tính lại toàn bộ tổng điểm an toàn
    let recalculatedTotal = 0;
    for (const ans of attempt.answers) {
      const p = Number(ans.pointsEarned);
      if (!isNaN(p)) {
        recalculatedTotal += p;
      }
    }
    attempt.totalScore = Number(recalculatedTotal.toFixed(2));

    // Tạm thời coi như một câu được chấm là có thể cập nhật, logic GRADED toàn phần nên được gọi tách biệt.
    await attempt.save();
  }

  // Cập nhật trạng thái Suggestion với Audit Fields
  suggestion.status =
    action === "reject" ? "REJECTED" : action === "adjust" ? "ADJUSTED" : "ACCEPTED";
  suggestion.action = action;
  suggestion.finalScore = action === "reject" ? null : pointsToAward;
  suggestion.teacherFeedback = teacherFeedback || "";
  suggestion.previousPointsEarned = previousPointsEarned;
  suggestion.reviewedBy = teacherId;
  suggestion.reviewedAt = new Date();
  await suggestion.save();

  return suggestion;
};

export default {
  generateGradeSuggestion,
  confirmGradeSuggestion,
};
