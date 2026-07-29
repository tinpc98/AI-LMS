import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    chunkId: { type: String, required: true },
    sourceName: { type: String, required: true },
    sourceType: { type: String, required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    excerpt: { type: String },
    score: { type: Number },
  },
  { _id: false }
);

const aiChatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIChatSession",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    warnings: {
      type: [String],
      default: [],
    },
    aiUsageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIUsage",
    },
    requestFingerprint: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

// Tránh double submit tin nhắn assistant với cùng fingerprint
aiChatMessageSchema.index(
  { sessionId: 1, role: 1, requestFingerprint: 1 },
  { unique: true, partialFilterExpression: { role: "assistant", requestFingerprint: { $type: "string" } } }
);

export default mongoose.model("AIChatMessage", aiChatMessageSchema);
