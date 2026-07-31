import promptManager from "../prompts/promptManager.js";
import { MockAIProvider } from "../providers/mock.provider.js";
import { GeminiAIProvider } from "../providers/gemini.provider.js";
import aiUsageService from "./aiUsage.service.js";
import { safeParseJSON } from "../parsers/outputParser.js";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

class AICoreService {
  constructor() {
    this.providers = new Map();
    this.mockProvider = new MockAIProvider();
    this.providers.set("mock", this.mockProvider);

    // Initialize Gemini provider if key available
    if (process.env.GEMINI_API_KEY) {
      this.geminiProvider = new GeminiAIProvider(process.env.GEMINI_API_KEY);
      this.providers.set("google-gemini", this.geminiProvider);
    }
  }

  /**
   * Resolve active provider instance
   */
  async resolveProvider(preferredProviderName) {
    if (process.env.AI_MOCK_MODE === "true" || process.env.NODE_ENV === "test") {
      return this.mockProvider;
    }

    const config = await aiUsageService.getOrCreateConfig();
    const providerName =
      process.env.AI_PROVIDER || preferredProviderName || config.defaultProvider || "google-gemini";

    if (providerName === "mock") return this.mockProvider;

    const modelName = process.env.AI_MODEL || config.defaultModel;
    if (!modelName) {
      throw new AIError(
        "Chưa cấu hình model name cho AI Provider!",
        AIErrorCode.AI_CONFIG_ERROR,
        500
      );
    }

    let provider = this.providers.get(providerName);
    if (provider) {
      provider.modelName = modelName;
    }

    // Lazy load Gemini if key became available in env
    if (!provider && providerName === "google-gemini") {
      if (process.env.GEMINI_API_KEY) {
        provider = new GeminiAIProvider(process.env.GEMINI_API_KEY, modelName);
        this.providers.set("google-gemini", provider);
      }
    }

    if (!provider) {
      if (process.env.AI_MOCK_MODE === "false") {
        throw new AIError(
          `Cấu hình AI Core chưa sẵn sàng: Thiếu API Key hoặc cấu hình sai cho provider '${providerName}'!`,
          AIErrorCode.AI_CONFIG_ERROR,
          500
        );
      }

      throw new AIError(
        `Cấu hình AI Core chưa sẵn sàng: Thiếu API Key cho provider '${providerName}'!`,
        AIErrorCode.AI_CONFIG_ERROR,
        500
      );
    }

    return provider;
  }

  /**
   * Execute Structured AI Request (Orchestration)
   */
  async executeStructuredAI({
    userId,
    userRole = "student",
    feature,
    templateName,
    promptParams = {},
    referenceId = null,
    referenceType = null,
    responseSchema = null,
    validatorFunc = null,
    timeoutMs = 30000,
  }) {
    if (!userId) {
      throw new AIError("userId là bắt buộc để thực thi AI!", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    // 1. Quota & Feature Flag Check
    const { config } = await aiUsageService.checkUserQuota(userId, userRole, feature);

    // 2. Build Prompt from PromptManager
    const builtPrompt = promptManager.build(templateName, promptParams);

    // 3. Resolve Provider
    const provider = await this.resolveProvider(config.defaultProvider);

    // 4. Reserve Quota (Create Pending AIUsage Record)
    const usageId = await aiUsageService.reserveQuota({
      userId,
      userRole,
      feature,
      provider: provider.getName(),
      model: provider.getModelName(),
      referenceId,
      referenceType,
    });

    let result = null;
    try {
      // 5. Execute AI Call
      result = await provider.generateJSON({
        prompt: builtPrompt.prompt,
        systemInstruction: builtPrompt.systemInstruction,
        responseSchema,
        timeoutMs,
      });

      // 6. Parse & Validate Output
      let validatedData = safeParseJSON(result.data || result.rawText);
      if (typeof validatorFunc === "function") {
        validatedData = validatorFunc(validatedData);
      }

      // 7. Finalize Successful Usage
      if (usageId) {
        await aiUsageService.finalizeUsage(usageId, {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          durationMs: result.durationMs,
          status: "success",
          prompt: builtPrompt.prompt,
        });
      }

      return {
        data: validatedData,
        usageId,
        usage: {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          durationMs: result.durationMs,
          provider: provider.getName(),
          model: provider.getModelName(),
        },
      };
    } catch (error) {
      // Finalize Failed Usage
      const errorMessage = error.message || "Unknown error";
      if (usageId) {
        let mappedStatus = "error";
        if (error.code === AIErrorCode.AI_TIMEOUT) mappedStatus = "timeout";
        else if (error.code === AIErrorCode.AI_OUTPUT_INVALID) mappedStatus = "invalid_output";

        await aiUsageService.finalizeUsage(usageId, {
          inputTokens: result ? result.inputTokens : 0,
          outputTokens: result ? result.outputTokens : 0,
          durationMs: result ? result.durationMs : 0,
          status: mappedStatus,
          errorMessage,
          prompt: builtPrompt ? builtPrompt.prompt : null,
        });
      }

      if (error instanceof AIError) throw error;
      throw new AIError(
        `Lỗi xử lý AI Core (${feature}): ${errorMessage}`,
        AIErrorCode.AI_PROVIDER_ERROR,
        500,
        error
      );
    }
  }
}

export default new AICoreService();
