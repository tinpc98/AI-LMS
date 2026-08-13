import mongoose, { Schema, model } from "mongoose";

const chatReceiptSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

chatReceiptSchema.index({ classId: 1, userId: 1 }, { unique: true });

const ChatReceipt = model("ChatReceipt", chatReceiptSchema);
export default ChatReceipt;
