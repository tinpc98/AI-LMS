import mongoose, { Schema } from "mongoose";

const studentBadgeSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeCode: {
      type: String,
      required: true,
      trim: true,
    },
    badgeType: {
      type: String,
      enum: ["Achievement", "Milestone", "Skill", "Event"],
      default: "Achievement",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

studentBadgeSchema.index({ studentId: 1, badgeCode: 1 }, { unique: true });

export default mongoose.model("StudentBadge", studentBadgeSchema);
