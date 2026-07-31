import crypto from "crypto";
import AIUsage from "../models/aiUsage.model.js";
import AIConfig from "../models/aiConfig.model.js";
import AIDailyQuota from "../models/aiDailyQuota.model.js";
import { AIError, AIErrorCode } from "../aiError.js";

class AIUsageService {
  /**
   * Fetch or create default system AIConfig
   */
  async getOrCreateConfig() {
    let config = await AIConfig.findOne({});
    if (!config) {
      config = await AIConfig.create({
        isGloballyEnabled: true,
        defaultProvider: process.env.AI_MOCK_MODE === "true" ? "mock" : "google-gemini",
        defaultModel: "gemini-1.5-flash",
      });
    }
    return config;
  }

  getDateString() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // return format YYYY-MM-DD local time relative to server
    return (
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")
    );
  }

  getRoleLimit(config, userRole) {
    const normalizedRole = (userRole || "student").toLowerCase();
    let dailyLimit = config.roleQuotas?.studentDailyQuota ?? 30;
    if (normalizedRole === "teacher") {
      dailyLimit = config.roleQuotas?.teacherDailyQuota ?? 100;
    } else if (normalizedRole === "admin") {
      dailyLimit = config.roleQuotas?.adminDailyQuota ?? 500;
    }
    return dailyLimit;
  }

  /**
   * Check if User has remaining daily quota for AI calls (Read-only, used by Middlewares for early rejection)
   */
  async checkUserQuota(userId, userRole = "student", feature = "summary") {
    const config = await this.getOrCreateConfig();

    if (!config.isGloballyEnabled) {
      throw new AIError(
        "Tính năng AI toàn hệ thống hiện đang tạm khóa bởi Quản trị viên!",
        AIErrorCode.AI_FEATURE_DISABLED,
        403
      );
    }

    const FEATURE_FLAG_MAP = {
      summary: "summary",
      "question-gen": "questionGen",
      "exam-gen": "examGen",
      grading: "grading",
      chatbot: "chatbot",
    };

    const mappedFeature = FEATURE_FLAG_MAP[feature] || feature;

    if (config.featureFlags && config.featureFlags[mappedFeature] === false) {
      throw new AIError(
        `Tính năng AI (${feature}) hiện đang bị tạm khóa!`,
        AIErrorCode.AI_FEATURE_DISABLED,
        403
      );
    }

    const dailyLimit = this.getRoleLimit(config, userRole);
    if (dailyLimit <= 0) {
      throw new AIError(
        `Bạn đã sử dụng hết hạn mức AI trong ngày (0/${dailyLimit} lượt).`,
        AIErrorCode.AI_QUOTA_EXCEEDED,
        429,
        { todayUsageCount: 0, dailyLimit }
      );
    }

    const dateString = this.getDateString();
    const quotaDoc = await AIDailyQuota.findOne({ userId, dateString });
    const todayUsageCount = quotaDoc ? quotaDoc.usageCount : 0;

    if (todayUsageCount >= dailyLimit) {
      throw new AIError(
        `Bạn đã sử dụng hết hạn mức AI trong ngày (${todayUsageCount}/${dailyLimit} lượt). Vui lòng thử lại vào ngày mai!`,
        AIErrorCode.AI_QUOTA_EXCEEDED,
        429,
        { todayUsageCount, dailyLimit }
      );
    }

    return { allowed: true, remaining: dailyLimit - todayUsageCount, dailyLimit, config };
  }

  hashPrompt(prompt) {
    if (!prompt) return null;
    return crypto.createHash("sha256").update(String(prompt)).digest("hex").slice(0, 32);
  }

  calculateCost(
    inputTokens = 0,
    outputTokens = 0,
    provider = "google-gemini",
    model = "gemini-1.5-flash"
  ) {
    if (provider === "mock") return { cost: 0, estimated: false };

    let inputCostRate = 0;
    let outputCostRate = 0;
    let isEstimated = false;

    if (model.includes("gemini-1.5-flash")) {
      inputCostRate = 0.075 / 1000000;
      outputCostRate = 0.3 / 1000000;
    } else if (model.includes("gemini-1.5-pro")) {
      inputCostRate = 1.25 / 1000000;
      outputCostRate = 5.0 / 1000000;
    } else {
      // Fallback
      inputCostRate = 0.075 / 1000000;
      outputCostRate = 0.3 / 1000000;
      isEstimated = true;
      console.warn(
        `[AIUsageService] Không có bảng giá cho model: ${model}. Dùng giá trị ước tính.`
      );
    }

    const totalCost = inputTokens * inputCostRate + outputTokens * outputCostRate;
    return { cost: Number(totalCost.toFixed(6)), estimated: isEstimated };
  }

  /**
   * Atomic Quota Reservation & Create Pending Record
   */
  async reserveQuota(params, retryCount = 0) {
    const {
      userId,
      userRole = "student",
      feature,
      provider = "google-gemini",
      model = "gemini-1.5-flash",
      referenceId = null,
      referenceType = null,
    } = params;
    const config = await this.getOrCreateConfig();
    const dailyLimit = this.getRoleLimit(config, userRole);

    if (dailyLimit <= 0) {
      throw new AIError(
        `Bạn đã sử dụng hết hạn mức AI trong ngày (0/0 lượt).`,
        AIErrorCode.AI_QUOTA_EXCEEDED,
        429,
        { todayUsageCount: 0, dailyLimit }
      );
    }

    const dateString = this.getDateString();

    const session = await AIUsage.startSession();
    try {
      let usageId = null;
      await session.withTransaction(async () => {
        // Atomic Update: Increment if < dailyLimit
        const quotaRecord = await AIDailyQuota.findOneAndUpdate(
          { userId, dateString, usageCount: { $lt: dailyLimit } },
          { $inc: { usageCount: 1 } },
          { new: true, upsert: true, setDefaultsOnInsert: true, session }
        );

        const usageArr = await AIUsage.create(
          [
            {
              userId,
              feature,
              provider,
              model,
              status: "pending",
              referenceId,
              referenceType,
              quotaState: "reserved",
              quotaDateString: dateString,
            },
          ],
          { session }
        );

        usageId = usageArr[0]._id;
      });
      return usageId;
    } catch (err) {
      if (err.code === 11000) {
        // Document exists. Is it because of concurrent insert or maxed quota?
        const existing = await AIDailyQuota.findOne({ userId, dateString });
        if (existing && existing.usageCount >= dailyLimit) {
          throw new AIError(
            `Bạn đã sử dụng hết hạn mức AI trong ngày (${existing.usageCount}/${dailyLimit} lượt).`,
            AIErrorCode.AI_QUOTA_EXCEEDED,
            429,
            { todayUsageCount: existing.usageCount, dailyLimit }
          );
        }

        // Concurrent insert caused E11000. Retry!
        if (retryCount < 2) {
          return this.reserveQuota(params, retryCount + 1);
        } else {
          throw new AIError(
            `Hệ thống đang bận, vui lòng thử lại sau.`,
            AIErrorCode.AI_PROVIDER_ERROR,
            503
          );
        }
      }

      console.error("[AIUsageService] ⚠️ Failed to reserve AI quota:", err.message);
      throw new AIError(
        `Lỗi hệ thống khi cấp phát Quota: ${err.message}`,
        AIErrorCode.AI_PROVIDER_ERROR,
        500
      );
    } finally {
      session.endSession();
    }
  }

  /**
   * Finalize AI Usage document asynchronously and idempotently
   */
  async finalizeUsage(
    usageId,
    {
      inputTokens = 0,
      outputTokens = 0,
      durationMs = 0,
      status = "success",
      errorMessage = null,
      prompt = null,
    }
  ) {
    if (!usageId) return;

    const session = await AIUsage.startSession();
    try {
      await session.withTransaction(async () => {
        // Find and claim the specific record
        const usage = await AIUsage.findOne({
          _id: usageId,
          status: "pending",
          quotaState: "reserved",
        }).session(session);

        if (!usage) {
          // No op if already finalized or not found
          return;
        }

        const totalTokens = inputTokens + outputTokens;
        const { cost: calculatedCost, estimated: isEstimated } = this.calculateCost(
          inputTokens,
          outputTokens,
          usage.provider,
          usage.model
        );

        usage.status = status;
        usage.inputTokens = inputTokens;
        usage.outputTokens = outputTokens;
        usage.totalTokens = totalTokens;
        usage.estimatedCost = calculatedCost; // using legacy estimatedCost field
        usage.durationMs = durationMs;
        usage.errorMessage = errorMessage;
        usage.promptHash = this.hashPrompt(prompt);
        usage.quotaState = "finalized";

        if (status === "success") {
          usage.quotaState = "consumed";
        } else {
          usage.quotaState = "refunded";
          usage.quotaRefundedAt = new Date();

          // Refund quota atomically only if usageCount > 0
          const refundRes = await AIDailyQuota.updateOne(
            { userId: usage.userId, dateString: usage.quotaDateString, usageCount: { $gt: 0 } },
            { $inc: { usageCount: -1 } },
            { session }
          );

          if (refundRes.modifiedCount === 0) {
            console.warn(
              `[AIUsageService] ⚠️ Cannot refund quota for usage ${usage._id}: usageCount is 0 or document missing.`
            );
          }
        }

        usage.finalizedAt = new Date();
        await usage.save({ session });
      });
    } catch (err) {
      console.error("[AIUsageService] ⚠️ Failed to finalize AI usage:", err.message);
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Backward compatible recordUsage (for scripts or simple usage)
   */
  async recordUsage(params) {
    const usageId = await this.reserveQuota(params);
    await this.finalizeUsage(usageId, params);
  }
}

export default new AIUsageService();
