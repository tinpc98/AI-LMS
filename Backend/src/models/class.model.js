import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

// Subdocument Schema cho lịch học
const scheduleSchema = new Schema(
  {
    days: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
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
    url: {
      type: String,
      required: [true, "URL tài nguyên là bắt buộc"],
      trim: true,
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
    className: {
      type: String,
      required: [true, "Tên lớp học là bắt buộc"],
      trim: true,
      minlength: 3,
    },
    classCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học liên kết là bắt buộc"],
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
    // Danh sách học sinh dạng Subdocument
    students: {
      type: [classStudentSchema],
      default: [],
    },
    meetingRoomId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
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
    learningMode: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"],
      default: "Offline",
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
    maxStudents: {
      type: Number,
      default: 30,
      min: 1,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0,
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
    // Mở rộng Enum trạng thái theo nghiệp vụ mới (hỗ trợ cả giá trị cũ "Upcoming", "Active")
    status: {
      type: String,
      enum: [
        "Draft",
        "Ready",
        "Ongoing",
        "Completed",
        "Cancelled",
        "Archived",
        "Upcoming",
        "Active",
      ],
      default: "Draft",
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes nâng cao hiệu năng truy vấn
classSchema.index({ classCode: 1 }, { unique: true, sparse: true });
classSchema.index({ meetingRoomId: 1 }, { unique: true });
classSchema.index({ teacherId: 1 });
classSchema.index({ courseId: 1 });
classSchema.index({ "students.studentId": 1 });
classSchema.index({ status: 1 });

// Hook chuẩn hóa dữ liệu trước khi validate (Hỗ trợ tương thích truyền mảng ID hoặc Subdocument)
classSchema.pre("validate", function () {
  if (Array.isArray(this.students)) {
    this.students = this.students.map((item) => {
      if (
        item &&
        (typeof item === "string" ||
          item instanceof mongoose.Types.ObjectId ||
          (typeof item === "object" && !item.studentId))
      ) {
        return {
          studentId: item._id || item,
          status: "Enrolled",
          joinedAt: new Date(),
          notes: "",
        };
      }
      return item;
    });
  }

  const studentCount = Array.isArray(this.students) ? this.students.length : 0;
  this.currentStudents = Math.min(studentCount, this.maxStudents);
  if (this.currentStudents < 0) {
    this.currentStudents = 0;
  }
});

classSchema.plugin(softDeletePlugin);

const classModel = model("Class", classSchema);
export default classModel;
