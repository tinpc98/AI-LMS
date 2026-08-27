import { Schema, model } from "mongoose";

// TÍNH NĂNG MỚI: mỗi lần học sinh làm Practice Quiz là 1 attempt riêng — BR-1.6 "cho làm lại
// không giới hạn, điểm ghi nhận là lần cao nhất" — nên KHÔNG upsert đè lên attempt cũ, chỉ
// cộng thêm; "điểm cao nhất" tính bằng query max(scorePercent) khi cần, không cache lệch nguồn.
const practiceQuizAnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOptionIds: [String],
    isCorrect: { type: Boolean, default: null },
  },
  { _id: false }
);

const practiceQuizAttemptSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "PracticeQuiz", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    answers: [practiceQuizAnswerSchema],
    // 0-100 — chấm tự động ngay khi nộp (BR: "Chấm: Tự động 100%").
    scorePercent: { type: Number, default: 0, min: 0, max: 100 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

practiceQuizAttemptSchema.index({ quizId: 1, studentId: 1 });
practiceQuizAttemptSchema.index({ lessonId: 1, studentId: 1 });

export default model("PracticeQuizAttempt", practiceQuizAttemptSchema);
