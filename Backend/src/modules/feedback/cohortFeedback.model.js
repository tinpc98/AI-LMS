// File: src/modules/feedback/cohortFeedback.model.js
// Đánh giá của học viên về giáo viên sau khi kết thúc một cohort — EduSpace mechanism design
// Phần C.3, BR-26. Là 1/3 thành phần cấu thành chỉ số Chất lượng (Quality), TÁCH BIỆT khỏi
// Độ tin cậy (Reliability, xem CommitmentEvent) — chỉ số này đo trải nghiệm học tập, không
// đo việc giáo viên có tới lớp đúng giờ hay không.
//
// Ẩn danh với giáo viên (giáo viên chỉ thấy điểm trung bình, không thấy ai đánh giá gì) —
// chỉ Admin xem được từng bản ghi — để học viên dám đánh giá thật, không sợ trù dập.
import { Schema, model } from "mongoose";

const cohortFeedbackSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratingClarity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    ratingHelpfulness: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Mỗi học viên chỉ đánh giá 1 lần cho mỗi lớp — chặn spam đánh giá hoặc đánh giá lặp.
cohortFeedbackSchema.index({ classId: 1, studentId: 1 }, { unique: true });
cohortFeedbackSchema.index({ teacherId: 1, createdAt: -1 });

const CohortFeedback = model("CohortFeedback", cohortFeedbackSchema);
export default CohortFeedback;
