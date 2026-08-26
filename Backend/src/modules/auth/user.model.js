import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

// Schema khung giờ làm việc theo ngày cho Giáo viên
const dayAvailabilitySchema = new Schema(
  {
    startTime: { type: String, trim: true, default: "08:00" },
    endTime: { type: String, trim: true, default: "17:00" },
    // default false (không phải true): khi cập nhật lịch rảnh chỉ gửi một phần (vd chỉ bật
    // Thứ 2/Thứ 3), Mongoose cast object thiếu field theo schema này cho từng ngày còn lại —
    // default cũ là true khiến MỌI ngày không đụng tới đều bị lưu thành "available: true",
    // xoá sạch ý nghĩa của việc chọn lọc ngày rảnh (đã xác nhận bằng dữ liệu thật trong DB).
    available: { type: Boolean, default: false },
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
      trim: true,
      lowercase: true,
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
      enum: ["Active", "Inactive", "Locked", "Expired"],
      default: "Active",
    },
    avatar: {
      type: String,
      default: "",
    },
    accountActivatedAt: {
      type: Date,
      default: null,
    },
    firstEnrollmentAt: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

    // --- Cơ chế cam kết & xác minh giáo viên (EduSpace mechanism design — Phần A/C) ---
    // L1: chỉ OTP xác thực, được nhận cohort dự bị. L2: Admin duyệt bằng cấp/video, được dạy
    // chính lớp COMMUNITY. L3: tự động khi đủ điều kiện đo được (BR-20), được dạy SPONSORED/
    // COMMERCIAL + quyền bảo lãnh người khác.
    verificationTier: {
      type: String,
      enum: ["L1", "L2", "L3"],
      default: "L1",
    },
    // Độ tin cậy (Reliability) — CHỈ đo hành vi giữ cam kết (có tới lớp không), KHÔNG đo chất
    // lượng dạy. Xem CommitmentEvent để biết nguồn tính. [0,100], 100 = chưa từng vi phạm.
    reliabilityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    // Danh sách người đã bảo lãnh cho giáo viên này lên L3 (BR-22).
    vouchedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Số người L3 này đang được phép bảo lãnh cùng lúc còn lại (BR-23) — giảm 1 mỗi lần bảo
    // lãnh ai đó đang chờ lên L3, cộng lại khi người được bảo lãnh hoàn tất hoặc bị từ chối.
    vouchLimit: {
      type: Number,
      default: 2,
      min: 0,
    },
    // Trạng thái được nhận cohort mới hay không (A.5) — tách khỏi `status` (Active/Inactive/
    // Locked/Expired) vốn là khóa tài khoản toàn hệ thống; đây chỉ khóa riêng việc NHẬN COHORT
    // MỚI, giáo viên vẫn đăng nhập/dạy nốt cohort đang ACTIVE bình thường.
    poolStatus: {
      type: String,
      enum: ["ACTIVE", "LOCKED", "REMOVED"],
      default: "ACTIVE",
    },
    // Chỉ có ý nghĩa khi poolStatus="LOCKED" — hết hạn thì transitionCommitment tự đưa về
    // ACTIVE ở lần kiểm tra kế tiếp (xem commitment.service.js).
    poolLockedUntil: {
      type: Date,
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
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
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
