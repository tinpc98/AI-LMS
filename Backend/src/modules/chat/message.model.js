import mongoose, { Schema, model } from "mongoose";

const attachmentSchema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    bytes: {
      type: Number,
      required: true,
      min: 0,
    },
    storageType: {
      type: String,
      default: "authenticated",
    },
    width: {
      type: Number,
      default: null, // Chỉ dùng cho ảnh
    },
    height: {
      type: Number,
      default: null, // Chỉ dùng cho ảnh
    },
  },
  { _id: false }
);

const reactionSchema = new Schema(
  {
    emoji: {
      type: String,
      required: true,
      enum: ["👍", "❤️", "😂", "😮", "😢", "🙏"], // Whitelist
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const messageSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người gửi là bắt buộc"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Nội dung tin nhắn không được vượt quá 5000 ký tự"],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // Mongoose tự động tạo createdAt và updatedAt
);

// Tối ưu cho query lấy danh sách tin nhắn theo classId, sắp xếp theo thời gian (dùng _id để phân trang)
messageSchema.index({ classId: 1, _id: -1 });

const Message = model("Message", messageSchema);
export default Message;
