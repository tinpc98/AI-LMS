import mongoose from "mongoose";

const aiConfigSchema = new mongoose.Schema(
  {
    isGloballyEnabled: {
      type: Boolean,
      default: true,
    },
    defaultProvider: {
      type: String,
      enum: ["google-gemini", "mock", "openai"],
      default: "google-gemini",
    },
    defaultModel: {
      type: String,
      default: "gemini-1.5-flash",
    },
    monthlyBudgetLimit: {
      type: Number,
      default: 50.0, // USD
    },
    featureFlags: {
      summary: { type: Boolean, default: true },
      questionGen: { type: Boolean, default: true },
      examGen: { type: Boolean, default: true },
      grading: { type: Boolean, default: true },
      chatbot: { type: Boolean, default: true },
    },
    roleQuotas: {
      teacherDailyQuota: { type: Number, default: 100 }, // Max AI calls / day
      studentDailyQuota: { type: Number, default: 30 },
      adminDailyQuota: { type: Number, default: 500 },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AIConfig", aiConfigSchema);
