import crypto from "crypto";
import AIGradingSuggestion from "../../models/aiGradingSuggestion.model.js";
import ExamAttempt from "../../models/examAttempt.model.js";
import aiCoreService from "./aiCore.service.js";
import aiUsageService from "./aiUsage.service.js";
import { resolveExamQuestions } from "../../utils/examQuestionResolver.js";
import { gradingPromptTemplate } from "../prompts/grading.prompt.js";
import { validateGradingOutput } from "../validators/gradingOutput.validator.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

const generateFingerprint = (payload) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};

/**
 * Tạo đề xuất chấm điểm từ AI
 */
const generateGradeSuggestion = async ({
  attemptId,
  questionId,
  teacherId,
}) => {
  // 1. Kiểm tra bài làm
  const attempt = await ExamAttempt.findById(attemptId).populate("examId");
  if (!attempt) {
    throw new AIError("Phiên làm bài không tồn tại", AIErrorCode.INVALID_INPUT, 404);
  }

  // 2. Lấy thông tin câu hỏi
  const exam = attempt.examId;
  const questionMap = await resolveExamQuestions(exam, [questionId]);
  const questionInfo = questionMap.get(questionId);

  if (!questionInfo) {
    throw new AIError("Câu hỏi không tồn tại trong đề thi", AIErrorCode.INVALID_INPUT, 404);
  }

  const qType = questionInfo.type?.toLowerCase();
  if (qType !== "essay" && qType !== "short_answer") {
    throw new AIError("Chỉ hỗ trợ AI chấm điểm câu hỏi tự luận (Essay / Short Answer)", AIErrorCode.INVALID_INPUT, 400);
  }

  // 3. Lấy câu trả lời của học sinh
  const studentAnswerObj = attempt.answers.find(
    (ans) => ans.questionId && ans.questionId.toString() === questionId
  );

  if (!studentAnswerObj) {
    throw new AIError("Học sinh chưa trả lời câu hỏi này", AIErrorCode.INVALID_INPUT, 404);
  }

  const studentText = studentAnswerObj.essayText || studentAnswerObj.selectedOption || "";

  // 4. Tạo fingerprint để kiểm tra tính Idempotency
  const maxScore = questionInfo.points || 1;
  const promptData = {
    questionContent: questionInfo.content,
    studentAnswer: studentText,
    referenceAnswer: questionInfo.suggestedAnswer || questionInfo.correctAnswer || "",
    rubric: questionInfo.rubric || null,
    maxScore,
  };

  const fingerprintPayload = {
    attemptId,
    questionId,
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

  // 5. Chuẩn bị AI request
  const builtPrompt = gradingPromptTemplate.buildPrompt(promptData);

  // Gọi AI Core service (Sẽ tự động reserve và consume/refund quota 'grading')
  let aiUsageId;
  const rawAiResult = await aiCoreService.processAIRequest(
    teacherId,
    "teacher",
    "grading",
    async (provider) => {
      const response = await provider.generateJSON({
        prompt: builtPrompt,
        systemInstruction: gradingPromptTemplate.systemInstruction,
        temperature: 0.1, // Cần tính quyết định cao cho chấm điểm
      });

      aiUsageId = response.usageId;
      return response;
    }
  );

  // 6. Validate kết quả trả về
  const validatedData = validateGradingOutput(rawAiResult.rawText, maxScore);

  // 7. Lưu lại kết quả đề xuất (Không ghi trực tiếp vào ExamAttempt)
  const suggestion = new AIGradingSuggestion({
    attemptId,
    questionId,
    suggestedScore: validatedData.suggestedScore,
    confidence: validatedData.confidence,
    aiFeedback: validatedData.aiFeedback,
    criterionScores: validatedData.criterionScores,
    warnings: validatedData.warnings,
    model: rawAiResult.model || "unknown",
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
  action,
  finalScore,
  teacherFeedback,
  teacherId,
}) => {
  const suggestion = await AIGradingSuggestion.findById(suggestionId);
  if (!suggestion) {
    throw new Error("Không tìm thấy kết quả đề xuất AI");
  }

  if (suggestion.status !== "PENDING_REVIEW") {
    throw new Error("Gợi ý này đã được duyệt hoặc bị thay thế");
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

  if (action === "accept" || action === "adjust") {
    if (typeof finalScore !== "number" || finalScore < 0 || finalScore > maxScore) {
      throw new Error(`Điểm xác nhận (${finalScore}) không hợp lệ (0 - ${maxScore})`);
    }

    // Cập nhật điểm chính thức vào ExamAttempt
    const answerIndex = attempt.answers.findIndex(
      (a) => a.questionId && a.questionId.toString() === suggestion.questionId.toString()
    );

    if (answerIndex === -1) {
      throw new Error("Học sinh không trả lời câu hỏi này, không thể ghi điểm");
    }

    // Tính lại tổng điểm
    attempt.totalScore = attempt.totalScore - attempt.answers[answerIndex].pointsEarned + finalScore;
    attempt.answers[answerIndex].pointsEarned = finalScore;
    
    // Ghi nhận phản hồi nếu giáo viên nhập thêm
    if (teacherFeedback) {
        attempt.answers[answerIndex].essayText += `\n\n--- Nhận xét của giáo viên ---\n${teacherFeedback}`;
    }

    // Kiểm tra xem đã chấm xong hết các câu tự luận chưa
    // Để làm điều này chính xác, ta cần biết có bao nhiêu câu tự luận trong bài.
    // Tạm thời nếu action được thực hiện, coi như đã có một bước duyệt.
    // Thực tế sẽ cần logic phức tạp hơn để chuyển status sang GRADED.

    await attempt.save();
  }

  // Cập nhật trạng thái Suggestion
  suggestion.status = action === "reject" ? "REJECTED" : "ACCEPTED";
  suggestion.reviewedBy = teacherId;
  suggestion.reviewedAt = new Date();
  await suggestion.save();

  return suggestion;
};

export default {
  generateGradeSuggestion,
  confirmGradeSuggestion,
};
