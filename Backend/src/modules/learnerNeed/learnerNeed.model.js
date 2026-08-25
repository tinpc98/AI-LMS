import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

// Cùng hình dạng với availabilityScheduleSchema trên User (auth/user.model.js) — có chủ ý
// trùng cấu trúc để sau này matching có thể so sánh trực tiếp theo từng ngày trong tuần
// giữa nhu cầu học viên và lịch rảnh giáo viên, không cần chuyển đổi định dạng.
const dayAvailabilitySchema = new Schema(
  {
    startTime: { type: String, trim: true, default: "08:00" },
    endTime: { type: String, trim: true, default: "17:00" },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

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

// Ghi nhận nhu cầu học tập của một học viên — mảnh dữ liệu MVP còn thiếu để có thể xếp lớp
// dựa trên nhu cầu thay vì chỉ dựa trên khoá học đã mua (xem R03 trong gap analysis
// EduSpace). Cố ý giữ tối giản: không có bảng matching/scoring riêng, admin/giáo viên đọc
// trực tiếp danh sách này để xếp lớp thủ công ở giai đoạn MVP.
const learnerNeedSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Học viên là bắt buộc"],
    },
    // Môn cần học — text tự do, giống teachingSubjects của giáo viên (chưa chuẩn hoá theo
    // Subject catalog ở MVP này, xem gap analysis R01/R03 để biết lý do).
    subject: {
      type: String,
      required: [true, "Môn cần học là bắt buộc"],
      trim: true,
    },
    // Trình độ hiện tại, học viên tự đánh giá — text ngắn, không ép enum để MVP không chặn
    // học viên vì chưa có thang trình độ chuẩn hoá.
    currentLevel: {
      type: String,
      trim: true,
      default: "",
    },
    // Mục tiêu / phần kiến thức đang yếu, vd "yếu hình học, muốn ôn thi học kỳ"
    goal: {
      type: String,
      required: [true, "Mục tiêu học tập là bắt buộc"],
      trim: true,
      maxlength: 500,
    },
    preferredFormat: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "ANY"],
      default: "ANY",
    },
    preferredTimes: {
      type: availabilityScheduleSchema,
      default: () => ({}),
    },
    // OPEN: đang chờ ghép; MATCHED: admin/giáo viên đã xếp lớp cho nhu cầu này;
    // CLOSED: học viên tự đóng (không cần nữa) hoặc admin đóng.
    status: {
      type: String,
      enum: ["OPEN", "MATCHED", "CLOSED"],
      default: "OPEN",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

learnerNeedSchema.index({ studentId: 1, status: 1 });
learnerNeedSchema.index({ subject: 1, status: 1 });

learnerNeedSchema.plugin(softDeletePlugin);

const LearnerNeed = model("LearnerNeed", learnerNeedSchema);
export default LearnerNeed;
