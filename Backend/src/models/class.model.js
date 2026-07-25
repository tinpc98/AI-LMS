import { Schema, model } from "mongoose";

const scheduleSchema = new Schema(
  {
    days: [{ type: String, trim: true }],
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

export const classSchema = new Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    classCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    schedule: {
      type: scheduleSchema,
      default: () => ({ days: [], startTime: "", endTime: "" }),
    },
    maxStudents: {
      type: Number,
      default: 30,
      min: 1,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Upcoming", "Active", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true },
);

classSchema.pre("save", function (next) {
  if (this.currentStudents > this.maxStudents) {
    this.currentStudents = this.maxStudents;
  }
  next();
});

const classModel = model("Class", classSchema);
export default classModel;
