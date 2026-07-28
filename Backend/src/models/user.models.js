import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

// Schema khung giờ làm việc theo ngày cho Giáo viên
const dayAvailabilitySchema = new Schema(
  {
    startTime: { type: String, trim: true, default: "08:00" },
    endTime: { type: String, trim: true, default: "17:00" },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

// Schema tổng hợp lịch rảnh hàng tuần cho Giáo viên
const availabilityScheduleSchema = new Schema(
  {
    Monday: { type: dayAvailabilitySchema, default: () => ({}) },
    Tuesday: { type: dayAvailabilitySchema, default: () => ({}) },
    Wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
    Thursday: { type: dayAvailabilitySchema, default: () => ({}) },
    Friday: { type: dayAvailabilitySchema, default: () => ({}) },
    Saturday: { type: dayAvailabilitySchema, default: () => ({}) },
    Sunday: { type: dayAvailabilitySchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Họ và tên là bắt buộc"],
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
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
    isDeleted: {
      type: Boolean,
      default: false
    },

    // --- CÁC TRƯỜNG DÀNH RIÊNG CHO TEACHER ---
    // Các môn học giáo viên đăng ký giảng dạy (VD: ["Mathematics", "Physics"])
    teachingSubjects: [
      {
        type: String,
        trim: true,
      },
    ],
    // Khung thời gian rảnh/có thể giảng dạy của giáo viên
    availabilitySchedule: {
      type: availabilityScheduleSchema,
      default: null,
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
  }
);

// Indexes phục vụ tìm kiếm nhanh theo Email, Role và Status
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hook tự động mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const passwordValue = this.password;
  const isHashed = /\$2[aby]\$\d{2}\$/.test(passwordValue);

  if (!isHashed) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(passwordValue, salt);
  }
});

userSchema.plugin(softDeletePlugin);

const User = model("User", userSchema);
export default User;
