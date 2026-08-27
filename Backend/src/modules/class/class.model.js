import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

// Subdocument Schema cho lịch học
const scheduleSchema = new Schema(
  {
    days: [
      {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      },
    ],
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Subdocument Schema cho học sinh tham gia lớp học
const classStudentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh là bắt buộc"],
    },
    status: {
      type: String,
      enum: ["Enrolled", "Reserved", "Transferred", "Dropped"],
      default: "Enrolled",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Subdocument Schema cho tài nguyên học tập của lớp
const resourceSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề tài nguyên là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["Document", "Video", "Link", "Other"],
      default: "Document",
    },
    // url dùng cho liên kết ngoài (YouTube, website). null khi là file upload.
    url: {
      type: String,
      trim: true,
      default: null,
    },
    // --- Các field cho file upload lên Cloudinary ---
    // publicId Cloudinary. null khi là liên kết ngoài.
    publicId: {
      type: String,
      trim: true,
      default: null,
    },
    // 'authenticated' — bắt buộc URL ký. null với liên kết ngoài.
    storageType: {
      type: String,
      default: null,
    },
    // 'raw' hoặc 'image'. null với liên kết ngoài.
    resourceType: {
      type: String,
      default: null,
    },
    // Định dạng file: 'pdf', 'docx', 'pptx'... null với liên kết ngoài.
    format: {
      type: String,
      default: null,
    },
    // Dung lượng tính bằng bytes, phục vụ tính quota lớp. 0 với liên kết ngoài.
    bytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tên file gốc khi người dùng tải về.
    originalFilename: {
      type: String,
      trim: true,
      default: null,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Subdocument Schema cho tỷ trọng điểm số của lớp học
const gradingWeightSchema = new Schema(
  {
    attendance: { type: Number, default: 10, min: 0, max: 100 },
    assignment: { type: Number, default: 20, min: 0, max: 100 },
    midterm: { type: Number, default: 30, min: 0, max: 100 },
    final: { type: Number, default: 40, min: 0, max: 100 },
  },
  { _id: false }
);

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên lớp học là bắt buộc"],
      trim: true,
      minlength: 3,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học liên kết là bắt buộc"],
    },
    level: {
      type: String,
      enum: ["FOUNDATION", "INTERMEDIATE", "ADVANCED"],
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Người quản trị (Admin) phân công lớp
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Thời điểm phân công
    assignedAt: {
      type: Date,
      default: null,
    },
    // Legacy Field (Deprecated): Danh sách học sinh cũ
    students: {
      type: [classStudentSchema],
      default: [],
    },
    // Legacy Field (Deprecated): Mã phòng Jitsi dùng chung cũ
    meetingRoomId: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    // Đường dẫn Google Meet phục vụ học trực tuyến
    googleMeetLink: {
      type: String,
      trim: true,
      default: "",
    },
    // Google Calendar Event ID phục vụ tích hợp lịch
    googleCalendarEventId: {
      type: String,
      trim: true,
      default: "",
    },
    classRoom: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      enum: ["OFFLINE", "ONLINE"],
      default: "OFFLINE",
    },
    schedule: {
      type: scheduleSchema,
      default: () => ({ days: [], startTime: "", endTime: "" }),
    },
    // Tỷ trọng điểm số môn học
    gradingWeight: {
      type: gradingWeightSchema,
      default: () => ({
        attendance: 10,
        assignment: 20,
        midterm: 30,
        final: 40,
      }),
    },
    // Danh sách tài nguyên bài học của lớp
    resources: {
      type: [resourceSchema],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    activeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextLiveSessionNumber: {
      type: Number,
      // Default to 0 so when first incremented it becomes 1.
      // But it's actually not strictly needed if we migrate.
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isEnrollmentOpen: {
      type: Boolean,
      default: true,
    },
    // Trạng thái vòng đời lớp học chuẩn hóa Domain 02.4
    status: {
      type: String,
      enum: ["DRAFT", "OPEN", "FULL", "CLOSED", "ARCHIVED"],
      default: "DRAFT",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // --- Cơ chế "đợt dạy" (cohort) — EduSpace mechanism design Phần A ---
    // Class hiện có ĐÃ có lịch/sĩ số/session — các field dưới đây chỉ thêm ngữ nghĩa
    // "cam kết hữu hạn" (BR-01, BR-02), không tạo model cohort riêng.
    cohortSessionCount: {
      type: Number,
      default: null,
      min: 1,
    },
    // Mốc lịch học được CHỐT — sau mốc này không đổi giờ/ngày, chỉ đổi giáo viên (BR-02).
    scheduleLockedAt: {
      type: Date,
      default: null,
    },
    plannedEndDate: {
      type: Date,
      default: null,
    },
    fundingType: {
      type: String,
      enum: ["COMMUNITY", "SPONSORED", "COMMERCIAL"],
      default: "COMMUNITY",
    },
    backupTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Trạng thái CAM KẾT của giáo viên với đợt — tách khỏi `status` (trạng thái vận hành
    // lớp) vì một lớp có thể OPEN/FULL trong khi cam kết giáo viên đang OFFERED/ACCEPTED.
    commitmentStatus: {
      type: String,
      enum: [
        "OFFERED",
        "ACCEPTED",
        "CONFIRMED",
        "ACTIVE",
        "COMPLETED",
        "COMPLETED_PARTIAL",
        "WITHDRAWN_EARLY",
        "WITHDRAWN_MIDWAY",
        "TERMINATED",
      ],
      default: "OFFERED",
    },
    // BR-14: mốc thời gian cohort ĐẠT ngưỡng buổi bị huỷ (Mức 3) cần Admin xem xét đóng sớm —
    // null nghĩa là chưa từng đạt ngưỡng. CHỈ ghi nhận, KHÔNG tự đóng (Phần B.5: quyết định đóng
    // sớm luôn là của Admin, ảnh hưởng người học thật). Giữ nguyên mốc lần đầu đạt ngưỡng dù sau
    // đó còn huỷ thêm buổi — đây là "đã từng đáng chú ý", không phải "đếm lại mỗi lần".
    cancelledSessionsFlaggedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes nâng cao hiệu năng truy vấn
// classSchema.index({ classCode: 1 }, { unique: true, sparse: true });
// classSchema.index({ meetingRoomId: 1 }, { unique: true });
classSchema.index({ teacherId: 1 });
classSchema.index({ courseId: 1 });
classSchema.index({ "students.studentId": 1 });
classSchema.index({ status: 1 });

// Compound indexes (Phase 4.2 Hardening)
classSchema.index({ courseId: 1, status: 1 });
classSchema.index({ status: 1, isDeleted: 1 });

// (Hook validate cũ đã bị gỡ bỏ để phục vụ migration và ClassEnrollment)

classSchema.plugin(softDeletePlugin);

const classModel = model("Class", classSchema);
export default classModel;
