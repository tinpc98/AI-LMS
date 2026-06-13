import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, minLength: 6, require: true },
    email: { type: String, require: true },
    password: { type: String, require: true },
  },
  {
    timestamps: true,
  },
);
export const userModel = model("user", userSchema);
