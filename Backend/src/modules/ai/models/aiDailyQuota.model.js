import mongoose from "mongoose";

const aiDailyQuotaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateString: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index for atomic UPSERT operations
aiDailyQuotaSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export default mongoose.model("AIDailyQuota", aiDailyQuotaSchema);
