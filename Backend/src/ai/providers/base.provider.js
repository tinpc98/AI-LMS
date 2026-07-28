import { AIError, AIErrorCode } from "../../utils/aiError.js";

/**
 * Base Abstract AI Provider
 * Defines strict contract for all AI integrations (Gemini, OpenAI, Mock, etc.)
 */
export class BaseAIProvider {
  constructor(name = "base-provider", modelName = "default-model") {
    this.name = name;
    this.modelName = modelName;
  }

  getName() {
    return this.name;
  }

  getModelName() {
    return this.modelName;
  }

  /**
   * Generate raw text completion
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemInstruction]
   * @param {number} [options.temperature=0.7]
   * @param {number} [options.maxTokens=2048]
   * @param {number} [options.timeoutMs=30000]
   * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, durationMs: number }>}
   */
  async generateText({ prompt, systemInstruction, temperature = 0.7, maxTokens = 2048, timeoutMs = 30000 }) {
    throw new AIError(
      `generateText() method not implemented in ${this.name}`,
      AIErrorCode.AI_PROVIDER_ERROR,
      500
    );
  }

  /**
   * Generate structured JSON completion
   * @param {Object} options
   * @param {string} options.prompt
   * @param {string} [options.systemInstruction]
   * @param {Object} [options.responseSchema]
   * @param {number} [options.temperature=0.2]
   * @param {number} [options.maxTokens=4096]
   * @param {number} [options.timeoutMs=30000]
   * @returns {Promise<{ data: any, rawText: string, inputTokens: number, outputTokens: number, durationMs: number }>}
   */
  async generateJSON({ prompt, systemInstruction, responseSchema, temperature = 0.2, maxTokens = 4096, timeoutMs = 30000 }) {
    throw new AIError(
      `generateJSON() method not implemented in ${this.name}`,
      AIErrorCode.AI_PROVIDER_ERROR,
      500
    );
  }

  /**
   * Calculate timeout promise helper
   */
  withTimeout(promise, ms, operationName = "AI Request") {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new AIError(
            `Quá thời gian xử lý AI (${ms}ms) cho thao tác: ${operationName}`,
            AIErrorCode.AI_TIMEOUT,
            504
          )
        );
      }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });
  }
}

export default BaseAIProvider;
