import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Teacher", "Student"],
      default: "Student",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Locked"],
      default: "Active",
    },
    avatar: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const passwordValue = this.password;
    const isHashed = /\$2[aby]\$\d{2}\$/.test(passwordValue);

    if (!isHashed) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(passwordValue, salt);
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

const User = model("User", userSchema);
export default User;
