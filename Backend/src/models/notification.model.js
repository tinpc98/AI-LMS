import mongoose, { Schema, model } from "mongoose";

/**
 * Notification Model – Lưu thông báo inbox cá nhân của từng người dùng.
 *
 * Khác với Announcement (thông báo chung của lớp/hệ thống),
 * Notification là bản ghi per-user: mỗi user nhận 1 document riêng,
 * cho phép theo dõi trạng thái đọc (isRead) của từng người.
 */
const notificationSchema = new Schema(
  {
    // Người nhận thông báo
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người nhận là bắt buộc"],
      index: true,
    },

    // Người gửi (Admin broadcast → lưu userId của Admin)
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Tiêu đề ngắn gọn hiển thị ở Notification Center
    title: {
      type: String,
      required: [true, "Tiêu đề thông báo là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },

    // Nội dung đầy đủ
    content: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc"],
      trim: true,
    },

    // Loại thông báo để FE render icon/màu sắc tương ứng
    type: {
      type: String,
      enum: ["system", "class", "grade", "attendance", "announcement", "exam"],
      default: "system",
    },

    // Trạng thái đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Thời điểm đọc (null nếu chưa đọc)
    readAt: {
      type: Date,
      default: null,
    },

    // URL deeplink để FE điều hướng khi click vào notification (optional)
    link: {
      type: String,
      default: null,
    },

    // Metadata bổ sung (VD: { classId, courseId, ... }) để FE xử lý linh hoạt
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes để tối ưu truy vấn inbox theo người dùng ───
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

const Notification = model("Notification", notificationSchema);
export default Notification;
