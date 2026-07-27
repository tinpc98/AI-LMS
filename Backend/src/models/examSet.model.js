import { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

// Question subdocument schema
const questionSchema = new Schema(
  {
    // Unique question ID within the exam set
    questionId: {
      type: String,
      required: [true, "questionId là bắt buộc"],
      trim: true,
    },

    // Question type: multiple_choice, true_false, short_answer, essay
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer", "essay"],
      required: [true, "Loại câu hỏi là bắt buộc"],
    },

    // Question content
    content: {
      type: String,
      required: [true, "Nội dung câu hỏi là bắt buộc"],
    },

    // Point value for this question
    points: {
      type: Number,
      default: 1,
      min: 0,
    },

    // Options for multiple choice questions
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],

    // Correct answer (for true/false or short answer)
    correctAnswer: String,

    // Explanation for the answer
    explanation: String,

    // Question difficulty level: easy, medium, hard
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // Tags for categorizing questions
    tags: [String],

    // Order of question in exam
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const examSetSchema = new Schema(
  {
    // ID of the exam set owner (Teacher/Admin)
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ownerId là bắt buộc"],
      index: true,
    },

    // Folder ID where this exam set belongs
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: [true, "folderId là bắt buộc"],
      index: true,
    },

    // Exam set title
    title: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      minlength: 1,
      maxlength: 255,
    },

    // Exam set description
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    // Status: draft, published, archived
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    // Questions array (subdocuments)
    questions: [questionSchema],

    // Auto-calculated: Total number of questions
    questionCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Version number for tracking changes
    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Tags for categorizing exam sets
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        return ret;
      },
    },
  }
);

// Apply soft delete plugin
examSetSchema.plugin(softDeletePlugin);

// Compound index for owner and folder
examSetSchema.index({ ownerId: 1, folderId: 1 });

// Index for finding published exam sets
examSetSchema.index({ ownerId: 1, status: 1 });

// Middleware to auto-update questionCount before save
examSetSchema.pre("save", function (next) {
  this.questionCount = this.questions.length;
  next();
});

const ExamSet = model("ExamSet", examSetSchema);

export default ExamSet;
