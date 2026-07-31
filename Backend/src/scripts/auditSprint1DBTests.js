import mongoose from "mongoose";
import dotenv from "dotenv";
import aiUsageService from "#modules/ai/services/aiUsage.service.js";
import aiCoreService from "#modules/ai/services/aiCore.service.js";
import AIConfig from "#modules/ai/models/aiConfig.model.js";
import AIUsage from "#modules/ai/models/aiUsage.model.js";
import AIDailyQuota from "#modules/ai/models/aiDailyQuota.model.js";
import { runAIPendingRecovery } from "../cron/jobs/aiPendingRecovery.job.js";

dotenv.config();

async function runAuditTests() {
  console.log("==================================================");
  console.log("🔍 AUDIT SPRINT 1 — TRANSACTIONAL QUOTA TESTS");
  console.log("==================================================\n");

  if (process.env.NODE_ENV !== "test") {
    console.error("❌ Fatal Error: NODE_ENV must be 'test'. Current:", process.env.NODE_ENV);
    process.exit(1);
  }

  const uri = process.env.MONGO_TEST_URI;
  if (!uri) {
    console.error("❌ Fatal Error: Missing MONGO_TEST_URI");
    process.exit(1);
  }

  if (!uri.endsWith("_test") && !uri.includes("_test?")) {
    console.error(
      "❌ Fatal Error: Database name in MONGO_TEST_URI must have '_test' suffix for safety."
    );
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for Testing...");

    // Sync indexes to make sure unique index on AIDailyQuota exists!
    await AIDailyQuota.syncIndexes();
    await AIUsage.syncIndexes();

    // Dọn dẹp dữ liệu test (Safe cleanup)
    const dummyUserId = new mongoose.Types.ObjectId();
    await AIUsage.deleteMany({ userId: dummyUserId });
    await AIDailyQuota.deleteMany({ userId: dummyUserId });

    const config = await aiUsageService.getOrCreateConfig();

    // -----------------------------------------------------
    // TEST 1: Concurrency 50 requests (Limit = 1)
    // -----------------------------------------------------
    console.log("\n--- TEST: Concurrency (50 requests đồng thời) ---");
    config.roleQuotas.studentDailyQuota = 1;
    await config.save();

    let successCount = 0;
    let rejectedCount = 0;
    let fallbackCount = 0;

    const promises = Array.from({ length: 50 }).map(() => {
      return aiCoreService
        .executeStructuredAI({
          userId: dummyUserId,
          userRole: "student",
          feature: "summary",
          templateName: "summary",
        })
        .then(() => {
          successCount++;
        })
        .catch((e) => {
          if (e.status === 429) rejectedCount++;
          else fallbackCount++;
        });
    });

    await Promise.all(promises);

    assert(
      successCount === 1,
      `Chỉ đúng 1 request được cấp Quota thành công (Đạt: ${successCount})`
    );
    assert(
      rejectedCount === 49,
      `Đúng 49 requests bị từ chối bằng mã lỗi 429 (Đạt: ${rejectedCount})`
    );
    assert(fallbackCount === 0, `Không có request nào sập do lỗi khác ngoài 429`);

    const quotaDoc = await AIDailyQuota.findOne({ userId: dummyUserId });
    assert(quotaDoc && quotaDoc.usageCount === 1, "Bảng quota đếm chính xác (usageCount = 1)");

    const usages = await AIUsage.find({ userId: dummyUserId });
    assert(usages.length === 1, "Chỉ tạo đúng 1 record AIUsage");
    assert(
      usages[0].quotaState === "consumed",
      "AIUsage quotaState = consumed (vì mock provider luôn thành công)"
    );

    // -----------------------------------------------------
    // TEST 2: Pending Recovery & Chống Double Refund
    // -----------------------------------------------------
    console.log("\n--- TEST: Pending Recovery & Chống Double Refund ---");
    config.roleQuotas.studentDailyQuota = 10;
    await config.save();
    await AIDailyQuota.updateOne({ userId: dummyUserId }, { $set: { usageCount: 2 } });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckUsage = await AIUsage.create({
      userId: dummyUserId,
      feature: "summary",
      provider: "google-gemini",
      model: "gemini-1.5-flash",
      status: "pending",
      quotaState: "reserved",
      quotaDateString: aiUsageService.getDateString(),
      createdAt: tenMinutesAgo,
    });

    let beforeRecover = await AIDailyQuota.findOne({ userId: dummyUserId });
    assert(beforeRecover.usageCount === 2, "Quota đang bị chiếm dụng (usageCount = 2)");

    // Chạy 4 Cronjob đồng thời
    const cronPromises = [
      runAIPendingRecovery(),
      runAIPendingRecovery(),
      runAIPendingRecovery(),
      runAIPendingRecovery(),
    ];

    const cronResults = await Promise.all(cronPromises);
    const totalRecoveredByAllCrons = cronResults.reduce((sum, res) => sum + res.totalRecovered, 0);

    assert(totalRecoveredByAllCrons === 1, "Atomic Cronjob: Chỉ 1 process claim được record kẹt");

    const recoveredUsage = await AIUsage.findById(stuckUsage._id);
    assert(recoveredUsage.status === "timeout", "Trạng thái được cập nhật thành 'timeout'");
    assert(recoveredUsage.quotaState === "refunded", "quotaState được cập nhật thành 'refunded'");

    const afterRecover = await AIDailyQuota.findOne({ userId: dummyUserId });
    assert(afterRecover.usageCount === 1, "Đã hoàn trả thành công 1 lượt (không double refund)");

    // -----------------------------------------------------
    // TEST 3: Đảm bảo không hoàn Quota nếu usageCount = 0
    // -----------------------------------------------------
    console.log("\n--- TEST: Chống âm usageCount ---");
    await AIDailyQuota.updateOne({ userId: dummyUserId }, { $set: { usageCount: 0 } });
    const fakePending = await AIUsage.create({
      userId: dummyUserId,
      feature: "summary",
      provider: "google-gemini",
      model: "gemini-1.5-flash",
      status: "pending",
      quotaState: "reserved",
      quotaDateString: aiUsageService.getDateString(),
      createdAt: tenMinutesAgo,
    });
    await runAIPendingRecovery();
    const finalQuota = await AIDailyQuota.findOne({ userId: dummyUserId });
    assert(finalQuota.usageCount === 0, "usageCount không bị trừ xuống âm khi refund");

    console.log("\n==================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Exception during test execution:", error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runAuditTests();
