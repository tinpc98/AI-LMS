// File: src/modules/class/commitmentEvent.model.js
// Nhật ký mọi lần chuyển trạng thái commitmentStatus của giáo viên với một lớp (cohort) —
// EduSpace mechanism design Phần A.2, BR-04. Bắt buộc ghi lý do (không phải text tự do) để
// tính điểm độ tin cậy minh bạch và có thể kiểm chứng lại (audit trail), tránh tranh cãi
// "tôi có lý do chính đáng" không có bằng chứng.
import { Schema, model } from "mongoose";

// Danh mục lý do cố định — Admin/hệ thống chọn từ đây, không nhập tự do (BR-08).
export const COMMITMENT_REASONS = [
  "SCHEDULE_FILLED", // Đủ học viên + lịch chốt, chuyển tự nhiên theo tiến trình
  "SESSION_COMPLETED", // Một buổi học hoàn thành bình thường
  "COHORT_COMPLETED", // Hoàn thành trọn vẹn cohortSessionCount buổi
  "WITHDREW_BEFORE_LOCK", // Rút trước khi scheduleLockedAt — không strike (BR-05)
  "CANCELLED_WITH_NOTICE", // Hủy ≥48h trước buổi — không strike nếu tần suất thấp
  "CANCELLED_LATE", // Hủy <24h trước buổi — strike nhẹ (BR-06)
  "NO_SHOW", // Không xuất hiện, không báo — strike nặng (BR-07)
  "FORCE_MAJEURE_EXCUSED", // Bất khả kháng, Admin duyệt miễn strike (BR-08)
  "ESCALATION_TERMINATED", // Bị gỡ theo quy trình leo thang Phần B
  "COHORT_CLOSED_EARLY_HIGH_PROGRESS", // Đóng sớm nhưng đã trôi ≥70% buổi — không strike (BR-19)
  "COHORT_CLOSED_EARLY_LOW_PROGRESS", // Đóng sớm khi mới trôi <30% buổi
  "BACKUP_ACTIVATED", // Dự bị được kích hoạt dạy thay (BR-10/11)
];

const commitmentEventSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: COMMITMENT_REASONS,
      required: true,
    },
    // Điểm strike ghi nhận tại thời điểm sự kiện (0 nếu sự kiện này không phạt) — lưu lại giá
    // trị đã áp dụng, không tính lại từ reason mỗi lần đọc, để lịch sử không đổi nếu công thức
    // điểm thay đổi về sau.
    strikeApplied: {
      type: Number,
      default: 0,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // null nếu hệ thống tự động ghi (VD strike NO_SHOW)
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

commitmentEventSchema.index({ classId: 1, createdAt: -1 });
commitmentEventSchema.index({ teacherId: 1, createdAt: -1 });

const CommitmentEvent = model("CommitmentEvent", commitmentEventSchema);
export default CommitmentEvent;
