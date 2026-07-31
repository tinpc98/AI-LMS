import mongoose from "mongoose";
import dotenv from "dotenv";
import AIUsage from "../models/aiUsage.model.js";

dotenv.config();

async function runDryRunMigration() {
  console.log("==================================================");
  console.log("🔍 DRY RUN MIGRATION: AIUsage Quota State");
  console.log("==================================================\n");

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Missing MONGO_URI");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for dry run...");

    const totalUsages = await AIUsage.countDocuments();
    console.log(`Total AIUsage records: ${totalUsages}`);

    const missingQuotaState = await AIUsage.countDocuments({ quotaState: { $exists: false } });
    console.log(`Records missing quotaState: ${missingQuotaState}`);

    if (missingQuotaState > 0) {
      const stats = await AIUsage.aggregate([
        { $match: { quotaState: { $exists: false } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      console.log("\nBreakdown of records to migrate by status:");
      stats.forEach((s) => {
        console.log(` - Status '${s._id}': ${s.count} records`);
      });

      console.log("\nProposed Migration Strategy (DRY RUN - No changes will be made):");
      console.log(
        " 1. status = 'pending' -> quotaState = 'reserved', quotaDateString = formatted(createdAt)"
      );
      console.log(
        " 2. status = 'success' -> quotaState = 'consumed', quotaDateString = formatted(createdAt), finalizedAt = formatted(updatedAt)"
      );
      console.log(
        " 3. status IN ('error', 'timeout', 'invalid_output') -> quotaState = 'refunded', quotaDateString = formatted(createdAt), quotaRefundedAt = formatted(updatedAt), finalizedAt = formatted(updatedAt)"
      );
    } else {
      console.log("No records need migration.");
    }
  } catch (error) {
    console.error("Migration dry run error:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log("\nDry run completed.");
  }
}

runDryRunMigration();
