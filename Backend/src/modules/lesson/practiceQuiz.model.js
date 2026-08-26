import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1.4): Practice Quiz phục vụ VIỆC HỌC (tự kiểm tra ngay
// sau khi học), khác hẳn Assignment/Exam phục vụ VIỆC ĐÁNH GIÁ — không tính vào điểm tổng kết,
// làm lại không giới hạn, hiện đáp án ngay sau mỗi câu. Đây là ranh giới nghiệp vụ quan trọng
// nhất của cả mục 1: đã tính điểm thì không cho làm lại vô hạn; đã cho làm lại vô hạn thì đừng
// tính điểm.
//
// Tái dùng ngân hàng câu hỏi (Question) đã có sẵn cơ chế chấm tự động cho MCQ/TRUE_FALSE (cùng
// pattern options[].isCorrect đã dùng cho Assignment/Exam) — CỐ Ý chỉ cho phép 2 loại này vào
// Practice Quiz vì đặc tả yêu cầu "chấm tự động 100%"; SHORT_ANSWER/ESSAY cần người/AI chấm,
// không đạt được yêu cầu đó.
const practiceQuizQuestionSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const practiceQuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    questions: [practiceQuizQuestionSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

practiceQuizSchema.plugin(softDeletePlugin);

export default model("PracticeQuiz", practiceQuizSchema);
