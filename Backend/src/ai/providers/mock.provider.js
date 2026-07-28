import { BaseAIProvider } from "./base.provider.js";

/**
 * Mock AI Provider for Testing & Offline Execution
 */
export class MockAIProvider extends BaseAIProvider {
  constructor(modelName = "mock-model-v1") {
    super("mock", modelName);

    this.customMockResponse = null;
    this.shouldSimulateError = false;
    this.simulatedErrorCode = null;
    this.delayMs = 50;
  }

  setMockResponse(response) {
    this.customMockResponse = response;
  }

  setSimulateError(shouldError, code = null) {
    this.shouldSimulateError = shouldError;
    this.simulatedErrorCode = code;
  }

  async waitForDelay() {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }

  throwSimulatedErrorIfNeeded() {
    if (!this.shouldSimulateError) {
      return;
    }

    throw new Error(
      `Mock AI Provider simulated error: ${
        this.simulatedErrorCode || "INTERNAL_ERROR"
      }`
    );
  }

  async generateText({
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
    timeoutMs = 30000,
  }) {
    const startTime = Date.now();

    await this.waitForDelay();
    this.throwSimulatedErrorIfNeeded();

    if (this.customMockResponse !== null) {
      return {
        text:
          typeof this.customMockResponse === "string"
            ? this.customMockResponse
            : JSON.stringify(this.customMockResponse),
        inputTokens: 50,
        outputTokens: 100,
        durationMs: Date.now() - startTime,
      };
    }

    const safePrompt = typeof prompt === "string" ? prompt : "";

    return {
      text: `[Mock AI Text Response] Dữ liệu phản hồi mẫu cho prompt: "${safePrompt.slice(
        0,
        30
      )}..."`,
      inputTokens: 30,
      outputTokens: 50,
      durationMs: Date.now() - startTime,
    };
  }

  async generateJSON({
    prompt,
    systemInstruction,
    responseSchema,
    temperature = 0.2,
    maxTokens = 4096,
    timeoutMs = 30000,
  }) {
    const startTime = Date.now();

    await this.waitForDelay();
    this.throwSimulatedErrorIfNeeded();

    if (this.customMockResponse !== null) {
      const text =
        typeof this.customMockResponse === "string"
          ? this.customMockResponse
          : JSON.stringify(this.customMockResponse);

      let parsed = this.customMockResponse;

      if (typeof this.customMockResponse === "string") {
        try {
          parsed = JSON.parse(this.customMockResponse);
        } catch {
          parsed = {
            raw: this.customMockResponse,
          };
        }
      }

      return {
        data: parsed,
        rawText: text,
        inputTokens: 50,
        outputTokens: 100,
        durationMs: Date.now() - startTime,
      };
    }

    const safePrompt = typeof prompt === "string" ? prompt : "";
    const lowerPrompt = safePrompt.toLowerCase();

    /*
     * Không chỉ kiểm tra từ "câu hỏi", vì prompt Summary hoặc Grading
     * cũng có thể chứa cụm từ này.
     *
     * Prompt sinh câu hỏi được nhận diện bằng các marker thuộc contract:
     * - tổng số câu hỏi
     * - phân bố loại câu hỏi
     * - phân bố độ khó
     *
     * Phải kiểm tra nhánh này trước Summary vì nội dung đầu vào có thể
     * chứa phần "BẢN TÓM TẮT ĐÃ DUYỆT".
     */
    const isQuestionGenerationPrompt =
      lowerPrompt.includes("tổng số câu hỏi") &&
      lowerPrompt.includes("phân bố loại câu hỏi") &&
      lowerPrompt.includes("phân bố độ khó");

    const isSummaryPrompt =
      lowerPrompt.includes("summary") ||
      lowerPrompt.includes("tóm tắt");

    const isGradingPrompt =
      lowerPrompt.includes("grade") ||
      lowerPrompt.includes("grading") ||
      lowerPrompt.includes("chấm bài");

    let mockData;

    if (isQuestionGenerationPrompt) {
      mockData = this.buildQuestionGenerationMock(safePrompt);
    } else if (isGradingPrompt) {
      mockData = this.buildGradingMock();
    } else if (isSummaryPrompt) {
      mockData = this.buildSummaryMock();
    } else {
      mockData = {
        message: "Mock response",
        status: "success",
      };
    }

    const rawText = JSON.stringify(mockData, null, 2);

    return {
      data: mockData,
      rawText,
      inputTokens: 60,
      outputTokens: 120,
      durationMs: Date.now() - startTime,
    };
  }

  buildSummaryMock() {
    return {
      summary:
        "Đây là bản tóm tắt nội dung bài giảng mẫu từ Mock AI Provider.",
      keyPoints: [
        "Điểm chính 1",
        "Điểm chính 2",
        "Điểm chính 3",
      ],
      suggestedReviewTopics: [
        "Chủ đề ôn tập 1",
        "Chủ đề ôn tập 2",
      ],
    };
  }

  buildGradingMock() {
    return {
      suggestedScore: 8.5,
      confidence: 0.9,
      aiFeedback:
        "Bài làm trả lời đúng các ý chính. Cần bổ sung ví dụ minh họa.",
      criterionScores: [
        {
          criterion: "Nội dung",
          scoreEarned: 5,
          maxScore: 6,
          feedback: "Tốt",
        },
        {
          criterion: "Trình bày",
          scoreEarned: 3.5,
          maxScore: 4,
          feedback: "Rõ ràng",
        },
      ],
    };
  }

  buildQuestionGenerationMock(prompt) {
    const supportedTypes = [
      "multiple_choice",
      "true_false",
      "short_answer",
      "essay",
    ];

    const supportedDifficulties = [
      "easy",
      "medium",
      "hard",
    ];

    const typeCounts = {
      multiple_choice: 0,
      true_false: 0,
      short_answer: 0,
      essay: 0,
    };

    const difficultyCounts = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    let totalCount = 0;
    const lines = prompt.split(/\r?\n/);

    for (const originalLine of lines) {
      const line = originalLine.trim().toLowerCase();

      const totalMatch = line.match(
        /^-\s*tổng số câu hỏi\s*:\s*(\d+)/
      );

      if (totalMatch) {
        totalCount = Number(totalMatch[1]);
        continue;
      }

      for (const type of supportedTypes) {
        const typePattern = new RegExp(
          `^-\\s*${type}\\s*:\\s*(\\d+)`
        );

        const typeMatch = line.match(typePattern);

        if (typeMatch) {
          typeCounts[type] = Number(typeMatch[1]);
        }
      }

      for (const difficulty of supportedDifficulties) {
        const difficultyPattern = new RegExp(
          `^-\\s*${difficulty}\\s*:\\s*(\\d+)`
        );

        const difficultyMatch = line.match(difficultyPattern);

        if (difficultyMatch) {
          difficultyCounts[difficulty] = Number(
            difficultyMatch[1]
          );
        }
      }
    }

    const parsedTypeTotal = Object.values(typeCounts).reduce(
      (total, count) => total + count,
      0
    );

    const parsedDifficultyTotal = Object.values(
      difficultyCounts
    ).reduce((total, count) => total + count, 0);

    if (!Number.isInteger(totalCount) || totalCount <= 0) {
      totalCount =
        parsedTypeTotal > 0
          ? parsedTypeTotal
          : parsedDifficultyTotal > 0
            ? parsedDifficultyTotal
            : 1;
    }

    /*
     * Fallback chỉ dùng cho Mock Provider.
     * Request production vẫn phải được validator kiểm tra trước khi tới đây.
     */
    if (parsedTypeTotal === 0) {
      typeCounts.multiple_choice = totalCount;
    }

    if (parsedDifficultyTotal === 0) {
      difficultyCounts.medium = totalCount;
    }

    const normalizedTypeTotal = Object.values(typeCounts).reduce(
      (total, count) => total + count,
      0
    );

    const normalizedDifficultyTotal = Object.values(
      difficultyCounts
    ).reduce((total, count) => total + count, 0);

    /*
     * Không âm thầm tạo output sai distribution.
     * Nếu parser Mock không đọc được đúng prompt contract,
     * lỗi phải xuất hiện rõ trong test.
     */
    if (normalizedTypeTotal !== totalCount) {
      throw new Error(
        `Mock Provider không đọc được phân bố loại câu hỏi: ` +
          `expected=${totalCount}, actual=${normalizedTypeTotal}`
      );
    }

    if (normalizedDifficultyTotal !== totalCount) {
      throw new Error(
        `Mock Provider không đọc được phân bố độ khó: ` +
          `expected=${totalCount}, actual=${normalizedDifficultyTotal}`
      );
    }

    const difficulties = [];

    for (const difficulty of supportedDifficulties) {
      for (
        let index = 0;
        index < difficultyCounts[difficulty];
        index += 1
      ) {
        difficulties.push(difficulty);
      }
    }

    const questions = [];
    let difficultyIndex = 0;
    let questionNumber = 1;

    for (const type of supportedTypes) {
      const count = typeCounts[type];

      for (let index = 0; index < count; index += 1) {
        const difficulty =
          difficulties[difficultyIndex] || "medium";

        difficultyIndex += 1;

        const question = {
          type,
          content: `Câu hỏi mô phỏng ${questionNumber} (${type}, ${difficulty})`,
          difficulty,
          points: 1,
          explanation: `Giải thích mô phỏng cho câu hỏi ${questionNumber}`,
        };

        if (type === "multiple_choice") {
          question.options = [
            {
              id: "option_1",
              text: "Phương án A",
            },
            {
              id: "option_2",
              text: "Phương án B",
            },
            {
              id: "option_3",
              text: "Phương án C",
            },
            {
              id: "option_4",
              text: "Phương án D",
            },
          ];

          question.correctAnswer = "option_1";
        }

        if (type === "true_false") {
          question.options = [
            {
              id: "true",
              text: "Đúng",
            },
            {
              id: "false",
              text: "Sai",
            },
          ];

          question.correctAnswer = "true";
        }

        if (type === "short_answer") {
          question.options = [];
          question.correctAnswer = "Đáp án ngắn mô phỏng";
          question.acceptedAnswers = [
            "Đáp án ngắn mô phỏng",
            "Đáp án tương đương",
          ];
        }

        if (type === "essay") {
          question.options = [];
          question.correctAnswer =
            "Nội dung tham khảo dành cho giáo viên.";

          question.rubric = [
            {
              criterion: "Nội dung",
              maxScore: 0.5,
            },
            {
              criterion: "Lập luận và trình bày",
              maxScore: 0.5,
            },
          ];
        }

        questions.push(question);
        questionNumber += 1;
      }
    }

    return {
      questions,
    };
  }
}

export default MockAIProvider;