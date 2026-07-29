import mongoose from "mongoose";

const aiKnowledgeChunkSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIKnowledgeSource",
      required: true,
      index: true,
    },
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
    chunkId: {
      type: String, // Do Backend sinh ra (vd: UUID)
      required: true,
      unique: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentHash: {
      type: String, // SHA-256 của content
      required: true,
      index: true,
    },
    embedding: {
      type: [Number],
      required: true,
      // Không trả embedding ra API thông thường
      select: false,
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
      required: true,
      index: true,
    },
    sourceName: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["ready", "superseded"],
      default: "ready",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AIKnowledgeChunk", aiKnowledgeChunkSchema);
