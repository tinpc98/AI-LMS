import mongoose from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const liveSessionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    roomName: { type: String, required: false, trim: true },
    meetingRoomId: { type: String, required: false, default: null, trim: true }, // Legacy Alias
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    scheduledStart: { type: Date, default: null },
    scheduledEnd: { type: Date, default: null },
    actualStart: { type: Date, default: null },
    actualEnd: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Scheduled", "Live", "Completed", "Cancelled"],
      default: "Live",
    },
    recordingUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

liveSessionSchema.index({ classId: 1, status: 1 });
liveSessionSchema.index({ roomName: 1 }, { sparse: true });
liveSessionSchema.index({ classId: 1, sessionNumber: 1 }, { unique: true });

// Partial Unique Index: Ngăn chặn tạo 2 phiên "Live" đồng thời cho cùng 1 Lớp học
liveSessionSchema.index(
  { classId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "Live",
      isDeleted: false,
    },
  }
);

liveSessionSchema.plugin(softDeletePlugin);

export default mongoose.model("LiveSession", liveSessionSchema);
