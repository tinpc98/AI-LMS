import AIUsage from "../../models/aiUsage.model.js";
import AIDailyQuota from "../../models/aiDailyQuota.model.js";

/**
 * Cleanup stuck "pending" AI Usage records.
 * Marks them as "timeout" and refunds the quota.
 */
export const runAIPendingRecovery = async () => {
  const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

  const stuckUsages = await AIUsage.find({
    status: "pending",
    quotaState: "reserved",
    createdAt: { $lte: cutoffTime },
  });

  if (stuckUsages.length === 0) return { totalRecovered: 0 };

  let recoveredCount = 0;
  for (const usage of stuckUsages) {
    const session = await AIUsage.startSession();
    try {
      await session.withTransaction(async () => {
        // 1. Atomic claim & Mark as timeout inside transaction
        const claimed = await AIUsage.findOneAndUpdate(
          { _id: usage._id, status: "pending", quotaState: "reserved" },
          { 
            $set: { 
              status: "timeout", 
              quotaState: "refunded",
              quotaRefundedAt: new Date(),
              finalizedAt: new Date(),
              errorMessage: "Hệ thống hoặc Provider không phản hồi sau 5 phút (Timeout tự động)" 
            } 
          },
          { session }
        );

        // Nếu claimed = null, cron trên node khác đã xử lý record này
        if (!claimed) return;

        // 2. Refund Quota transactionally only if usageCount > 0
        const refundRes = await AIDailyQuota.updateOne(
          { userId: usage.userId, dateString: usage.quotaDateString, usageCount: { $gt: 0 } },
          { $inc: { usageCount: -1 } },
          { session }
        );

        if (refundRes.modifiedCount === 0) {
          console.warn(`[CRON WARNING] Không thể hoàn Quota cho usage ${usage._id}: usageCount đã = 0 hoặc không tìm thấy document.`);
        }

        recoveredCount++;
      });
    } catch (err) {
      console.error(`[CRON ERROR] Lỗi khi xử lý recovery cho usage ${usage._id}:`, err.message);
    } finally {
      session.endSession();
    }
  }

  return { totalRecovered: recoveredCount };
};
