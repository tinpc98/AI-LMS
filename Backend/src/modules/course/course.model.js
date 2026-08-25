import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const courseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
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
    prices: {
      type: Map,
      of: Number,
      default: {
        FOUNDATION: 0,
        INTERMEDIATE: 0,
        ADVANCED: 0,
      }
    },
    duration: {
      value: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: ["MONTH", "WEEK", "DAY"],
        default: "WEEK",
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes nâng cao hiệu năng truy vấn khóa học
courseSchema.index({ subjectId: 1, status: 1 });
courseSchema.index({ createdBy: 1 });

courseSchema.plugin(softDeletePlugin);

const Course = model("Course", courseSchema);
export default Course;
