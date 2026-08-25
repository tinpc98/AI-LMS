import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const onlineMeetingSchema = new Schema(
  {
    roomId: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ["NOT_CREATED", "OPEN", "CLOSED"],
      default: "NOT_CREATED",
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { _id: false }
);

const classSessionSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionNumber: { type: Number, required: true },
    title: { type: String, trim: true, required: true },
    sessionType: {
      type: String,
      enum: ["REGULAR", "MAKEUP"],
      default: "REGULAR",
    },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
    scheduledStartAt: { type: Date, required: true },
    scheduledEndAt: { type: Date, required: true },
    actualStartAt: { type: Date, default: null },
    actualEndAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
    physicalRoom: { type: String, trim: true, default: "" },
    makeupForSessionId: { type: Schema.Types.ObjectId, ref: "ClassSession", default: null },
    cancelReason: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    onlineMeeting: {
      type: onlineMeetingSchema,
      default: () => ({ status: "NOT_CREATED" }),
    },
    // Chuyển mảng participants legacy từ LiveSession thành evidence tạm
    // Nhưng Attendance model mới là Single Source of Truth
    // Mảng này không còn cần thiết, tuy nhiên ta có thể giữ để log raw join/leave socket
    rawParticipants: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User" },
        joinTime: { type: Date },
        leaveTime: { type: Date },
        durationSeconds: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

classSessionSchema.index(
  { classId: 1, scheduledStartAt: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
classSessionSchema.index(
  { classId: 1, sessionNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
classSessionSchema.index({ teacherId: 1, scheduledStartAt: 1 });

classSessionSchema.plugin(softDeletePlugin);

export default model("ClassSession", classSessionSchema);
