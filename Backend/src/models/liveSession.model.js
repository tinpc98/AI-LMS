import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true },
    roomName: { type: String, required: true, unique: true }, // Tên phòng duy nhất (UUID/Slug)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isLive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

// Index kép giúp tăng tốc độ truy vấn kiểm tra phòng đang live của lớp học
liveSessionSchema.index({ classId: 1, isLive: 1 });

export default mongoose.model("LiveSession", liveSessionSchema);
