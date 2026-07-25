import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    meetingRoomId: { type: String, required: true, trim: true },
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
liveSessionSchema.index({ classId: 1, sessionNumber: 1 }, { unique: true });

export default mongoose.model("LiveSession", liveSessionSchema);
