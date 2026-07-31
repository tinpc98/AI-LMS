import { GoogleGenAI } from "@google/genai";
import { BaseAIProvider } from "./base.provider.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

const AI_PROVIDER_MAX_ATTEMPTS = parseInt(process.env.AI_PROVIDER_MAX_ATTEMPTS, 10) || 3;
const AI_PROVIDER_RETRY_BASE_MS = parseInt(process.env.AI_PROVIDER_RETRY_BASE_MS, 10) || 300;
const AI_PROVIDER_RETRY_MAX_MS = parseInt(process.env.AI_PROVIDER_RETRY_MAX_MS, 10) || 3000;

// Fakeable sleep for unit testing
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Google Gemini AI Provider Implementation
 */
export class GeminiAIProvider extends BaseAIProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY, modelName) {
    super("google-gemini", modelName);
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Ensure API key and model name are configured
   */
  _ensureConfigured() {
    if (!this.apiKey) {
      throw new AIError(
        "Chưa cấu hình GEMINI_API_KEY trong biến môi trường!",
        AIErrorCode.AI_CONFIG_ERROR,
        500
      );
    }
    if (!this.modelName) {
      throw new AIError(
        "Chưa cấu hình model name cho Google Gemini API!",
        AIErrorCode.AI_CONFIG_ERROR,
        500
      );
    }
  }

  /**
   * Determine if an error is transient and should be retried
   */
  _isTransientError(error) {
    const msg = error.message || "";
    // Transient errors
    if (
      msg.includes("429") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("quota") ||
      msg.includes("502") ||
      msg.includes("503") ||
      msg.includes("UNAVAILABLE") ||
      msg.includes("overloaded") ||
      msg.includes("504") ||
      msg.includes("DEADLINE_EXCEEDED") ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("ENOTFOUND")
    ) {
      return true;
    }
    return false;
  }

  /**
   * Normalize Gemini API errors to AIError
   */
  _handleError(error, operationName = "Gemini Call") {
    if (error instanceof AIError) throw error;

    const msg = error.message || "";
    if (msg.includes("API key") || msg.includes("UNAUTHENTICATED")) {
      throw new AIError(
        "GEMINI_API_KEY không hợp lệ hoặc hết hạn!",
        AIErrorCode.AI_CONFIG_ERROR,
        401,
        error
      );
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new AIError(
        "Đã vượt quá hạn mức quota của Google Gemini API (429)!",
        AIErrorCode.AI_RATE_LIMIT_EXCEEDED,
        429,
        error
      );
    }
    if (msg.includes("INVALID_ARGUMENT") || msg.includes("400")) {
      throw new AIError(
        "Tham số gửi lên Google Gemini không hợp lệ (400)!",
        AIErrorCode.AI_INVALID_INPUT,
        400,
        error
      );
    }
    if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
      throw new AIError(
        "Không có quyền truy cập Google Gemini API (403)!",
        AIErrorCode.AI_PROVIDER_ERROR,
        403,
        error
      );
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
      throw new AIError(
        "Dịch vụ Google Gemini đang tạm thời bị quá tải (503)!",
        AIErrorCode.AI_PROVIDER_ERROR,
        503,
        error
      );
    }
    if (msg.includes("504") || msg.includes("DEADLINE_EXCEEDED")) {
      throw new AIError(
        "Google Gemini API phản hồi quá chậm (504)!",
        AIErrorCode.AI_TIMEOUT,
        504,
        error
      );
    }

    throw new AIError(
      `Lỗi khi gọi Google Gemini API (${operationName}): ${msg}`,
      AIErrorCode.AI_PROVIDER_ERROR,
      502,
      error
    ); // Map unhandled to 502
  }

  /**
   * Wrapper for executing with retry and exponential backoff
   */
  async _executeWithRetry(operation, operationName) {
    let attempt = 1;
    let lastError = null;

    while (attempt <= AI_PROVIDER_MAX_ATTEMPTS) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Skip retry if not transient or if it's already an AIError that shouldn't be retried
        if (!this._isTransientError(error)) {
          this._handleError(error, operationName);
        }

        if (attempt >= AI_PROVIDER_MAX_ATTEMPTS) {
          break;
        }

        // Exponential backoff with jitter
        const backoffMs = Math.min(
          AI_PROVIDER_RETRY_BASE_MS * Math.pow(2, attempt - 1),
          AI_PROVIDER_RETRY_MAX_MS
        );
        const jitter = Math.random() * 100; // 0-100ms jitter
        const sleepMs = backoffMs + jitter;

        await sleep(sleepMs);
        attempt++;
      }
    }

    // If we reach here, all attempts failed
    this._handleError(lastError, operationName);
  }

  async generateText({
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
    timeoutMs = 30000,
  }) {
    this._ensureConfigured();
    const startTime = Date.now();

    const executionPromise = this._executeWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const rawText = typeof response.text === "string" ? response.text.trim() : "";

      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason || "UNKNOWN";
      const blockReason = response.promptFeedback?.blockReason || null;
      const usageMetadata = response.usageMetadata || {};

      if (!rawText) {
        throw new AIError(
          `Gemini không trả về nội dung. finishReason=${finishReason}, blockReason=${blockReason || "NONE"}`,
          AIErrorCode.AI_PROVIDER_ERROR,
          502
        );
      }

      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;
      const totalTokens = usageMetadata.totalTokenCount || 0;

      return {
        text: rawText,
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs: Date.now() - startTime,
        provider: this.providerName,
        model: this.modelName,
        finishReason,
      };
    }, "generateText");

    return this.withTimeout(executionPromise, timeoutMs, "generateText");
  }

  async generateJSON({
    prompt,
    systemInstruction,
    responseSchema,
    temperature = 0.1,
    maxTokens = 4096,
    timeoutMs = 30000,
  }) {
    this._ensureConfigured();
    const startTime = Date.now();

    const executionPromise = this._executeWithRetry(async () => {
      const generationConfig = {
        systemInstruction: systemInstruction || undefined,
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        ...(responseSchema ? { responseJsonSchema: responseSchema } : {}),
      };

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: generationConfig,
      });

      const rawText = typeof response.text === "string" ? response.text.trim() : "";

      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason || "UNKNOWN";
      const blockReason = response.promptFeedback?.blockReason || null;
      const usageMetadata = response.usageMetadata || {};

      if (!rawText) {
        throw new AIError(
          `Gemini không trả về nội dung. finishReason=${finishReason}, blockReason=${blockReason || "NONE"}`,
          AIErrorCode.AI_PROVIDER_ERROR,
          502
        );
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawText);
      } catch (cause) {
        const safePreview = rawText.slice(0, 200).replace(/\s+/g, " ");
        throw new AIError(
          `Phản hồi Gemini không phải JSON hợp lệ. finishReason=${finishReason}, preview=${safePreview}`,
          AIErrorCode.AI_OUTPUT_INVALID,
          502,
          cause
        );
      }

      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;
      const totalTokens = usageMetadata.totalTokenCount || 0;

      return {
        data: parsedData,
        rawText,
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs: Date.now() - startTime,
        provider: this.providerName,
        model: this.modelName,
        finishReason,
      };
    }, "generateJSON");

    return this.withTimeout(executionPromise, timeoutMs, "generateJSON");
  }

  async generateEmbedding({
    text,
    taskType = "RETRIEVAL_DOCUMENT",
    dimensions = 768,
    timeoutMs = 30000,
  }) {
    this._ensureConfigured();
    const startTime = Date.now();

    const executionPromise = this._executeWithRetry(async () => {
      if (!text || typeof text !== "string" || text.trim() === "") {
        throw new AIError(
          "Nội dung text để nhúng không hợp lệ hoặc bị rỗng",
          AIErrorCode.AI_INVALID_INPUT,
          400
        );
      }

      const embeddingModel = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-2";

      const response = await this.ai.models.embedContent({
        model: embeddingModel,
        contents: text,
        config: {
          taskType,
          outputDimensionality: dimensions,
        },
      });

      const vector = response.embeddings?.[0]?.values;

      if (!Array.isArray(vector)) {
        throw new AIError(
          "Gemini không trả về mảng vector hợp lệ",
          AIErrorCode.AI_PROVIDER_ERROR,
          502
        );
      }

      if (vector.length !== dimensions) {
        throw new AIError(
          `Vector trả về (${vector.length} chiều) không khớp với số chiều yêu cầu (${dimensions} chiều)`,
          AIErrorCode.AI_PROVIDER_ERROR,
          502
        );
      }

      for (let i = 0; i < vector.length; i++) {
        const num = vector[i];
        if (typeof num !== "number" || !Number.isFinite(num)) {
          throw new AIError(
            "Vector chứa giá trị không hợp lệ (NaN/Infinity)",
            AIErrorCode.AI_PROVIDER_ERROR,
            502
          );
        }
      }

      return {
        embedding: vector,
        durationMs: Date.now() - startTime,
      };
    }, "generateEmbedding");

    return this.withTimeout(executionPromise, timeoutMs, "generateEmbedding");
  }
}

export default GeminiAIProvider;
