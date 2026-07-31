import { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const courseSchema = new Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    subject: {
      type: String,
      enum: ["Mathematics", "Physics", "Chemistry", "English", "Literature"],
      required: true,
    },
    grade: {
      type: Number,
      default: 12,
      min: 1,
      max: 12,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    tuitionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationWeeks: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    target: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes nâng cao hiệu năng truy vấn khóa học
courseSchema.index({ subject: 1, status: 1 });
courseSchema.index({ createdBy: 1 });

courseSchema.plugin(softDeletePlugin);

const Course = model("Course", courseSchema);
export default Course;
