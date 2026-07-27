import { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

/**
 * Question Subdocument Schema
 * Questions are embedded in ExamSet (no separate collection)
 * Supports: multiple_choice, true_false, short_answer, essay
 */
const questionSchema = new Schema(
  {
    // ========== IDENTIFICATION ==========
    // Unique question ID within the exam set (auto-generated or custom)
    questionId: {
      type: String,
      required: [true, "questionId là bắt buộc"],
      trim: true,
    },

    // Question order/position in exam
    order: {
      type: Number,
      required: [true, "Thứ tự câu hỏi là bắt buộc"],
      min: 0,
    },

    // ========== QUESTION CONTENT ==========
    // Question type: multiple_choice, true_false, short_answer, essay
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer", "essay"],
      required: [true, "Loại câu hỏi là bắt buộc"],
    },

    // Main question text/content
    content: {
      type: String,
      required: [true, "Nội dung câu hỏi là bắt buộc"],
      trim: true,
    },

    // Optional: Image/attachment URL for visual questions
    imageUrl: {
      type: String,
      default: null,
    },

    // Optional: Hint for students (shown during attempt)
    hint: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // ========== SCORING ==========
    // Points/marks for this question
    points: {
      type: Number,
      required: [true, "Điểm câu hỏi là bắt buộc"],
      default: 1,
      min: 0,
      max: 1000,
    },

    // Difficulty level: easy, medium, hard
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // ========== ANSWER & VERIFICATION ==========
    // For MULTIPLE_CHOICE: Array of answer options
    options: [
      {
        _id: false,
        id: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: [true, "Nội dung option là bắt buộc"],
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Correct answer text (for TRUE_FALSE, SHORT_ANSWER)
    correctAnswer: {
      type: String,
      default: "",
    },

    // Accepted variations of correct answer (for SHORT_ANSWER)
    acceptedAnswers: [
      {
        type: String,
        trim: true,
      },
    ],

    // Is correct answer case-sensitive? (for SHORT_ANSWER)
    caseSensitive: {
      type: Boolean,
      default: false,
    },

    // ========== FEEDBACK & EXPLANATION ==========
    // Explanation of correct answer (shown after submission)
    explanation: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    // Positive feedback (shown for correct answers)
    feedbackCorrect: {
      type: String,
      default: "Chính xác!",
    },

    // Negative feedback (shown for incorrect answers)
    feedbackIncorrect: {
      type: String,
      default: "Sai rồi!",
    },

    // ========== CATEGORIZATION & METADATA ==========
    // Sub-category/topic of question
    category: {
      type: String,
      default: "",
      trim: true,
    },

    // Tags for filtering/organization
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // ========== STATUS & TIMING ==========
    // Is question active? (false = question skipped in exams)
    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional: Time limit for this specific question (in seconds)
    timeLimit: {
      type: Number,
      default: null,
      min: 1,
    },
  },
  { _id: false, timestamps: false }
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
