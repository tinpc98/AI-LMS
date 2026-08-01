import mongoose from "mongoose";

const aiKnowledgeSourceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["lesson_text", "attachment_pdf", "attachment_docx", "approved_summary"],
      required: true,
    },
    sourceId: {
      type: String, // Có thể là publicId của attachment, hoặc chuỗi định danh
      required: true,
    },
    sourceName: {
      type: String,
      required: true,
    },
    sourceFingerprint: {
      type: String, // SHA-256 hash của content + model + dimensions
      required: true,
    },
    embeddingModel: {
      type: String,
      required: true,
    },
    embeddingDimensions: {
      type: Number,
      required: true,
    },
    indexVersion: {
      type: Number,
      default: 1,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "indexing", "ready", "failed", "superseded"],
      default: "pending",
      index: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    indexedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    indexedAt: {
      type: Date,
    },
    errorCode: {
      type: String,
    },
    safeErrorMessage: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Tránh trùng lặp version cho cùng một fingerprint của lesson
aiKnowledgeSourceSchema.index(
  { lessonId: 1, sourceFingerprint: 1, indexVersion: 1 },
  { unique: true }
);

export default mongoose.model("AIKnowledgeSource", aiKnowledgeSourceSchema);
