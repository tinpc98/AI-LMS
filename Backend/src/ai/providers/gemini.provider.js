import { GoogleGenAI } from "@google/genai";
import { BaseAIProvider } from "./base.provider.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

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
   * Normalize Gemini API errors to AIError
   */
  _handleError(error, operationName = "Gemini Call") {
    if (error instanceof AIError) throw error;

    const msg = error.message || "";
    if (msg.includes("API key") || msg.includes("UNAUTHENTICATED")) {
      throw new AIError("GEMINI_API_KEY không hợp lệ hoặc hết hạn!", AIErrorCode.AI_PROVIDER_ERROR, 401, error);
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new AIError("Đã vượt quá hạn mức quota của Google Gemini API (429)!", AIErrorCode.AI_RATE_LIMIT_EXCEEDED, 429, error);
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
      throw new AIError("Dịch vụ Google Gemini đang tạm thời bị quá tải (503)!", AIErrorCode.AI_PROVIDER_ERROR, 503, error);
    }

    throw new AIError(`Lỗi khi gọi Google Gemini API (${operationName}): ${msg}`, AIErrorCode.AI_PROVIDER_ERROR, 500, error);
  }

  async generateText({ prompt, systemInstruction, temperature = 0.7, maxTokens = 2048, timeoutMs = 30000 }) {
    this._ensureConfigured();
    const startTime = Date.now();

    const executionPromise = (async () => {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature,
            maxOutputTokens: maxTokens,
          },
        });

        const text = response.text || "";

        const usageMetadata = response.usageMetadata || {};
        const inputTokens = usageMetadata.promptTokenCount || Math.ceil(prompt.length / 4);
        const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(text.length / 4);

        return {
          text,
          inputTokens,
          outputTokens,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        this._handleError(error, "generateText");
      }
    })();

    return this.withTimeout(executionPromise, timeoutMs, "generateText");
  }

  async generateJSON({ prompt, systemInstruction, responseSchema, temperature = 0.1, maxTokens = 4096, timeoutMs = 30000 }) {
    this._ensureConfigured();
    const startTime = Date.now();

    const executionPromise = (async () => {
      try {
        const generationConfig = {
          systemInstruction: systemInstruction || undefined,
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        };

        if (responseSchema) {
          generationConfig.responseSchema = responseSchema;
        }

        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: generationConfig,
        });

        const rawText = response.text || "";

        let data;
        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          throw new AIError(
            `Phản hồi từ Gemini không đúng định dạng JSON hợp lệ: ${jsonErr.message}`,
            AIErrorCode.AI_OUTPUT_INVALID,
            502,
            { rawText }
          );
        }

        const usageMetadata = response.usageMetadata || {};
        const inputTokens = usageMetadata.promptTokenCount || Math.ceil(prompt.length / 4);
        const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(rawText.length / 4);

        return {
          data,
          rawText,
          inputTokens,
          outputTokens,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        this._handleError(error, "generateJSON");
      }
    })();

    return this.withTimeout(executionPromise, timeoutMs, "generateJSON");
  }
}

export default GeminiAIProvider;
