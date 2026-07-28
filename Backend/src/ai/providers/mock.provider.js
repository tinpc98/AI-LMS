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

  async generateText({ prompt, systemInstruction, temperature = 0.7, maxTokens = 2048, timeoutMs = 30000 }) {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    if (this.shouldSimulateError) {
      throw new Error(`Mock AI Provider simulated error: ${this.simulatedErrorCode || "INTERNAL_ERROR"}`);
    }

    if (this.customMockResponse) {
      return {
        text: typeof this.customMockResponse === "string" ? this.customMockResponse : JSON.stringify(this.customMockResponse),
        inputTokens: 50,
        outputTokens: 100,
        durationMs: Date.now() - startTime,
      };
    }

    return {
      text: `[Mock AI Text Response] Dữ liệu phản hồi mẫu cho prompt: "${prompt.slice(0, 30)}..."`,
      inputTokens: 30,
      outputTokens: 50,
      durationMs: Date.now() - startTime,
    };
  }

  async generateJSON({ prompt, systemInstruction, responseSchema, temperature = 0.2, maxTokens = 4096, timeoutMs = 30000 }) {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    if (this.shouldSimulateError) {
      throw new Error(`Mock AI Provider simulated error: ${this.simulatedErrorCode || "INTERNAL_ERROR"}`);
    }

    if (this.customMockResponse) {
      const text = typeof this.customMockResponse === "string" ? this.customMockResponse : JSON.stringify(this.customMockResponse);
      let parsed = this.customMockResponse;
      if (typeof this.customMockResponse === "string") {
        try {
          parsed = JSON.parse(this.customMockResponse);
        } catch (e) {
          parsed = { raw: this.customMockResponse };
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

    // Default intelligent mocks based on prompt keywords
    let mockData = {};
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("summary") || lowerPrompt.includes("tóm tắt")) {
      mockData = {
        summary: "Đây là bản tóm tắt nội dung bài giảng mẫu từ Mock AI Provider.",
        keyPoints: ["Điểm chính 1", "Điểm chính 2", "Điểm chính 3"],
        suggestedReviewTopics: ["Chủ đề ôn tập 1", "Chủ đề ôn tập 2"],
      };
    } else if (lowerPrompt.includes("exam") || lowerPrompt.includes("bộ đề") || lowerPrompt.includes("câu hỏi")) {
      mockData = {
        title: "Bộ đề thi tạo tự động bởi AI (Mock)",
        description: "Bộ đề ôn tập mẫu",
        questions: [
          {
            type: "multiple_choice",
            content: "Câu hỏi trắc nghiệm mẫu 1?",
            options: [
              { id: "opt_a", text: "Đáp án A" },
              { id: "opt_b", text: "Đáp án B" },
              { id: "opt_c", text: "Đáp án C" },
              { id: "opt_d", text: "Đáp án D" },
            ],
            correctAnswer: "opt_a",
            points: 5.0,
            difficulty: "medium",
            explanation: "Giải thích đáp án A đúng.",
          },
          {
            type: "essay",
            content: "Câu hỏi tự luận mẫu 1?",
            points: 5.0,
            difficulty: "medium",
            rubric: [
              { criterion: "Ý tưởng chính", maxScore: 3.0 },
              { criterion: "Trình bày", maxScore: 2.0 },
            ],
          },
        ],
      };
    } else if (lowerPrompt.includes("grade") || lowerPrompt.includes("chấm bài")) {
      mockData = {
        suggestedScore: 8.5,
        confidence: 0.9,
        aiFeedback: "Bài làm trả lời đúng các ý chính. Cần bổ sung ví dụ minh họa.",
        criterionScores: [
          { criterion: "Nội dung", scoreEarned: 5.0, maxScore: 6.0, feedback: "Tốt" },
          { criterion: "Trình bày", scoreEarned: 3.5, maxScore: 4.0, feedback: "Rõ ràng" },
        ],
      };
    } else {
      mockData = { message: "Mock response", status: "success" };
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
}

export default MockAIProvider;
