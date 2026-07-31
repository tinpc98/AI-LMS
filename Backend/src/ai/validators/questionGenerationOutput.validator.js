import { AIError, AIErrorCode } from "../../utils/aiError.js";
import crypto from "crypto";

export const validateQuestionGenerationOutput = (parsedData, requestConfig) => {
  if (!parsedData || typeof parsedData !== "object") {
    throw new AIError("Output AI không phải là JSON object", AIErrorCode.AI_OUTPUT_INVALID, 422);
  }

  if (!Array.isArray(parsedData.questions)) {
    throw new AIError("Output AI thiếu mảng 'questions'", AIErrorCode.AI_OUTPUT_INVALID, 422);
  }

  const { questionCount, questionTypes, difficultyDistribution, defaultPoints } = requestConfig;
  const questions = parsedData.questions;

  if (questions.length !== questionCount) {
    throw new AIError(
      `AI sinh sai số lượng câu hỏi. Yêu cầu: ${questionCount}, Thực tế: ${questions.length}`,
      AIErrorCode.AI_OUTPUT_INVALID,
      422
    );
  }

  const actualTypes = { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 };
  const actualDifficulties = { easy: 0, medium: 0, hard: 0 };
  const contentSet = new Set();

  const validQuestions = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // Normalize string fields
    if (typeof q.content !== "string") {
      throw new AIError(`Câu ${i + 1}: Nội dung không hợp lệ`, AIErrorCode.AI_OUTPUT_INVALID, 422);
    }
    const cleanContent = q.content.normalize("NFC").trim();
    if (!cleanContent) {
      throw new AIError(`Câu ${i + 1}: Nội dung rỗng`, AIErrorCode.AI_OUTPUT_INVALID, 422);
    }

    // Check duplicates
    const contentHash = crypto.createHash("md5").update(cleanContent.toLowerCase()).digest("hex");
    if (contentSet.has(contentHash)) {
      throw new AIError(`Câu ${i + 1}: Nội dung bị trùng lặp`, AIErrorCode.AI_OUTPUT_INVALID, 422);
    }
    contentSet.add(contentHash);

    // Validate type and difficulty
    const type = q.type;
    const difficulty = q.difficulty || "medium";

    if (!actualTypes.hasOwnProperty(type)) {
      throw new AIError(
        `Câu ${i + 1}: Type không hỗ trợ '${type}'`,
        AIErrorCode.AI_OUTPUT_INVALID,
        422
      );
    }
    if (!actualDifficulties.hasOwnProperty(difficulty)) {
      throw new AIError(
        `Câu ${i + 1}: Difficulty không hỗ trợ '${difficulty}'`,
        AIErrorCode.AI_OUTPUT_INVALID,
        422
      );
    }

    actualTypes[type]++;
    actualDifficulties[difficulty]++;

    // Validate points
    const points = typeof q.points === "number" ? q.points : defaultPoints;
    if (points < 0 || !Number.isFinite(points)) {
      throw new AIError(`Câu ${i + 1}: Points không hợp lệ`, AIErrorCode.AI_OUTPUT_INVALID, 422);
    }

    const validatedQ = {
      questionId: crypto.randomUUID(), // Always generate own internal UUID
      order: i,
      type,
      content: cleanContent,
      difficulty,
      points,
      options: [],
      correctAnswer: "",
      explanation:
        q.explanation && typeof q.explanation === "string"
          ? q.explanation.normalize("NFC").trim()
          : "",
    };

    if (type === "multiple_choice" || type === "true_false") {
      if (!Array.isArray(q.options)) {
        throw new AIError(`Câu ${i + 1}: Thiếu mảng options`, AIErrorCode.AI_OUTPUT_INVALID, 422);
      }
      if (type === "multiple_choice" && q.options.length < 2) {
        throw new AIError(
          `Câu ${i + 1}: Multiple choice cần ít nhất 2 options`,
          AIErrorCode.AI_OUTPUT_INVALID,
          422
        );
      }
      if (type === "true_false" && q.options.length !== 2) {
        throw new AIError(
          `Câu ${i + 1}: True/False phải có đúng 2 options`,
          AIErrorCode.AI_OUTPUT_INVALID,
          422
        );
      }

      const optIds = new Set();
      validatedQ.options = q.options.map((opt) => {
        if (!opt.id || !opt.text || typeof opt.text !== "string") {
          throw new AIError(
            `Câu ${i + 1}: Option thiếu id hoặc text`,
            AIErrorCode.AI_OUTPUT_INVALID,
            422
          );
        }
        const optId = String(opt.id).trim();
        if (optIds.has(optId)) {
          throw new AIError(
            `Câu ${i + 1}: Option id '${optId}' bị trùng`,
            AIErrorCode.AI_OUTPUT_INVALID,
            422
          );
        }
        optIds.add(optId);
        return {
          id: optId,
          text: opt.text.normalize("NFC").trim(),
        };
      });

      if (!q.correctAnswer) {
        throw new AIError(`Câu ${i + 1}: Thiếu correctAnswer`, AIErrorCode.AI_OUTPUT_INVALID, 422);
      }
      const ansId = String(q.correctAnswer).trim();
      if (!optIds.has(ansId)) {
        throw new AIError(
          `Câu ${i + 1}: correctAnswer '${ansId}' không nằm trong options`,
          AIErrorCode.AI_OUTPUT_INVALID,
          422
        );
      }
      validatedQ.correctAnswer = ansId;

      // Update isCorrect for schema compatibility
      validatedQ.options.forEach((opt) => {
        opt.isCorrect = opt.id === validatedQ.correctAnswer;
      });
    } else if (type === "short_answer") {
      if (!q.correctAnswer || typeof q.correctAnswer !== "string") {
        throw new AIError(
          `Câu ${i + 1}: Thiếu correctAnswer cho short_answer`,
          AIErrorCode.AI_OUTPUT_INVALID,
          422
        );
      }
      validatedQ.correctAnswer = q.correctAnswer.normalize("NFC").trim();
      if (Array.isArray(q.acceptedAnswers)) {
        validatedQ.acceptedAnswers = q.acceptedAnswers
          .filter((a) => typeof a === "string")
          .map((a) => a.normalize("NFC").trim());
      }
    } else if (type === "essay") {
      if (Array.isArray(q.rubric)) {
        validatedQ.rubric = q.rubric.map((r) => ({
          criterion: (r.criterion || "").normalize("NFC").trim(),
          maxScore: typeof r.maxScore === "number" ? r.maxScore : 0,
        }));
      }
    }

    validQuestions.push(validatedQ);
  }

  // Validate distributions match exactly
  for (const [t, count] of Object.entries(questionTypes || {})) {
    if (actualTypes[t] !== count) {
      throw new AIError(
        `Phân bố type '${t}' sai. Yêu cầu: ${count}, Thực tế: ${actualTypes[t]}`,
        AIErrorCode.AI_OUTPUT_INVALID,
        422
      );
    }
  }

  for (const [d, count] of Object.entries(difficultyDistribution || {})) {
    if (actualDifficulties[d] !== count) {
      throw new AIError(
        `Phân bố difficulty '${d}' sai. Yêu cầu: ${count}, Thực tế: ${actualDifficulties[d]}`,
        AIErrorCode.AI_OUTPUT_INVALID,
        422
      );
    }
  }

  return {
    questions: validQuestions,
    warnings: Array.isArray(parsedData.warnings) ? parsedData.warnings : [],
  };
};
