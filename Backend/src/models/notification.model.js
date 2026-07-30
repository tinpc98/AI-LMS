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

    // Người gửi (Admin/Teacher thực hiện hành động)
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Legacy: Người gửi (Admin broadcast)
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

    // Nội dung thông báo
    message: {
      type: String,
      trim: true,
    },

    // Legacy: Nội dung đầy đủ
    content: {
      type: String,
      trim: true,
    },

    // Loại thông báo để FE render icon/màu sắc tương ứng
    type: {
      type: String,
      // Đã mở rộng enum để hỗ trợ các sự kiện thực tế mới
      enum: ["system", "class", "grade", "attendance", "announcement", "exam", "LIVE_SESSION_CREATED", "CLASS_ENROLLED"],
      default: "system",
    },

    entityType: {
      type: String,
      enum: ["LIVE_SESSION", "CLASS", "EXAM", "ASSIGNMENT", "ANNOUNCEMENT", "SYSTEM", "NONE"],
      default: "NONE"
    },

    entityId: {
      type: Schema.Types.ObjectId,
      default: null
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null
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

    actionUrl: {
      type: String,
      default: null,
    },

    // Legacy: URL deeplink để FE điều hướng
    link: {
      type: String,
      default: null,
    },

    // Metadata bổ sung (VD: { className, teacherName, sessionNumber, ... })
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

// Idempotency (Chống tạo thông báo trùng): Đảm bảo 1 user không nhận 2 thông báo cùng type cho cùng 1 entity.
// Sử dụng partialFilterExpression để bỏ qua những thông báo không có entityId (như bulk system notification).
notificationSchema.index(
  { recipientId: 1, type: 1, entityId: 1 },
  { unique: true, partialFilterExpression: { entityId: { $ne: null } } }
);

const Notification = model("Notification", notificationSchema);
export default Notification;
