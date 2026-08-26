import { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

// TÍNH NĂNG MỚI: Quản lý Topic thật — trước đây model này chỉ có 3 field (name/courseId/order)
// và không có CRUD nào, mỗi khóa học chỉ có đúng 1 Topic mặc định tự sinh lúc tạo Lesson đầu
// tiên. Thêm status (vòng đời DRAFT→PUBLISHED→ARCHIVED, theo đặc tả nghiệp vụ mục 2.3) và
// description/createdBy/updatedBy để có đủ thông tin cho CRUD thật.
const topicSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tên Topic là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    // Vòng đời (đặc tả mục 2.3): DRAFT -> PUBLISHED -> ARCHIVED. Xóa được chỉ khi 0 item VÀ
    // 0 dữ liệu học sinh (topic.service.js#deleteTopicService) — nếu không, chỉ archive được.
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

topicSchema.plugin(softDeletePlugin);

topicSchema.index({ courseId: 1, order: 1 });
topicSchema.index({ courseId: 1, status: 1 });

export default model("Topic", topicSchema);
