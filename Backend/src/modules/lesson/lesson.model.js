import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";
import { contentBlockSchema } from "../question/question.model.js";

const lessonSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Bài giảng phải thuộc về một Chủ đề (Topic)"],
    },
    title: {
      type: String,
      required: [true, "Tiêu đề bài giảng là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    content: [contentBlockSchema],
    videoIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    documentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bài giảng phải có người tạo"],
    },
  },
  { timestamps: true }
);

lessonSchema.index({ topicId: 1, order: 1 });
lessonSchema.index({ topicId: 1, status: 1 });
lessonSchema.index({ createdBy: 1 });

lessonSchema.plugin(softDeletePlugin);

export default model("Lesson", lessonSchema);
