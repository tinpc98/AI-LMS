import mongoose, { Schema, model } from "mongoose";

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề thông báo là bắt buộc"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc"],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người tạo thông báo là bắt buộc"],
    },
    scope: {
      type: String,
      enum: ["System", "Course", "Class"],
      required: [true, "Phạm vi thông báo là bắt buộc"],
      default: "Class",
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      validate: {
        validator: function (value) {
          // Nếu phạm vi là Class thì classId bắt buộc phải có
          if (this.scope === "Class") {
            return value != null;
          }
          return true;
        },
        message: "Thông báo cấp Lớp học (scope = Class) bắt buộc phải truyền classId",
      },
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Indexes nâng cao tốc độ truy vấn thông báo theo phạm vi và thời gian
announcementSchema.index({ scope: 1, classId: 1 });
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ createdAt: -1 });

// Pre-validate hook: Tự động xóa classId nếu scope = System
announcementSchema.pre("validate", function (next) {
  if (this.scope === "System") {
    this.classId = null;
  }
  next();
});

const Announcement = model("Announcement", announcementSchema);
export default Announcement;
