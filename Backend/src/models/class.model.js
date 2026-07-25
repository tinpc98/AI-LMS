import { Schema, model } from "mongoose";

const scheduleSchema = new Schema(
  {
    days: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const classSchema = new Schema(
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
      default: null,
    },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    meetingRoomId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    classRoom: {
      type: String,
      trim: true,
      default: "",
    },
    learningMode: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"],
      default: "Offline",
    },
    schedule: {
      type: scheduleSchema,
      default: () => ({ days: [], startTime: "", endTime: "" }),
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
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
    description: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isEnrollmentOpen: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Active", "Completed", "Cancelled"],
      default: "Upcoming",
    },
  },
  { timestamps: true }
);

classSchema.index({ classCode: 1 }, { unique: true, sparse: true });
classSchema.index({ meetingRoomId: 1 }, { unique: true });

classSchema.pre("validate", function (next) {
  const studentCount = Array.isArray(this.students) ? this.students.length : 0;
  this.currentStudents = Math.min(studentCount, this.maxStudents);
  if (this.currentStudents < 0) {
    this.currentStudents = 0;
  }
  next();
});

const classModel = model("Class", classSchema);
export default classModel;
