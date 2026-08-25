import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

export const contentBlockSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["TEXT", "FORMULA", "IMAGE"],
      required: true,
    },
    order: { type: Number, required: true, default: 0 },
    // Fields for TEXT
    text: { type: String },
    // Fields for FORMULA
    latex: { type: String },
    displayMode: { type: String, enum: ["INLINE", "BLOCK"] },
    // Fields for IMAGE
    image: {
      url: { type: String },
      alt: { type: String },
      caption: { type: String },
    },
  },
  { _id: false }
);

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    content: [contentBlockSchema],
    isCorrect: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    primarySkillId: {
      type: Schema.Types.ObjectId,
      ref: "Skill",
    },
    type: {
      type: String,
      enum: ["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"],
      required: true,
    },
    // Dành cho MCQ
    selectionMode: {
      type: String,
      enum: ["SINGLE", "MULTIPLE"],
    },
    content: [contentBlockSchema],
    options: [optionSchema],
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    explanation: [contentBlockSchema],
    tags: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

questionSchema.index({ topicId: 1, status: 1 });
questionSchema.index({ createdBy: 1, status: 1 });

questionSchema.plugin(softDeletePlugin);

export default model("Question", questionSchema);
