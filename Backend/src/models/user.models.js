import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
  },
  {
    timestamps: true,
  },
);

const User = model("user", userSchema);
export default User;
