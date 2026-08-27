// File: src/modules/complaint/complaint.model.js
// Khiếu nại/tranh chấp — EduSpace mechanism design Phần C.6. Lưu trữ tối thiểu 1 năm kể cả
// sau khi đóng (BR-31), kể cả kết luận "không vi phạm" — phục vụ phát hiện mẫu hình nếu cùng
// một giáo viên bị khiếu nại lặp lại từ nhiều học viên khác nhau.
import { Schema, model } from "mongoose";

export const COMPLAINT_CATEGORIES = [
  "TEACHING_QUALITY",
  "NO_SHOW_UNREPORTED",
  "INAPPROPRIATE_BEHAVIOR",
  "CHILD_SAFETY", // BR-28, BR-30 — ưu tiên tuyệt đối, SLA rút ngắn
  "OTHER",
];

const complaintSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    // Buổi học liên quan, nếu có — phục vụ tra lại ghi hình (BR-27) khi cần xem lại.
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ClassSession",
      default: null,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aboutTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Mô tả khiếu nại là bắt buộc"],
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "RESOLVED"],
      default: "SUBMITTED",
    },
    // Thời điểm Admin phản hồi lần đầu — dùng để đo có vi phạm SLA (BR-30) hay không.
    firstRespondedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

complaintSchema.index({ aboutTeacherId: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });

const Complaint = model("Complaint", complaintSchema);
export default Complaint;
