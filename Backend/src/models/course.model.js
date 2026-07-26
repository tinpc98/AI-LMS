import { Schema, model } from "mongoose";

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
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  },
);

const Course = model("Course", courseSchema);
export default Course;
