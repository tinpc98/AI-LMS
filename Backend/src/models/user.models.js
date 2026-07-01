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
      enum: ["Student", "Teacher", "Admin"],
      default: "Student",
    },
  },
  {
    timestamps: true,
  },
);

const User = model("User", userSchema);
export default User;
