import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";
import { contentBlockSchema } from "../question/question.model.js";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1): Lesson là container chứa nhiều BLOCK có thứ tự, mỗi
// block thuộc 1 trong 3 loại VIDEO/DOCUMENT/PRACTICE_QUIZ, giáo viên đánh dấu bắt buộc/tùy
// chọn. Trước đây chỉ có videoIds/documentIds — mảng phẳng không thứ tự, không có required,
// không có quiz, và Video/Document là 2 model riêng nhưng 0 controller/route (không ai tạo
// được thật). MVP video là NHÚNG LINK (YouTube/Vimeo unlisted), không tự host — nên nhúng
// thẳng thông tin video vào block thay vì tham chiếu 1 collection Video rời cần cả 1 hệ CRUD
// upload/lưu trữ mà mục tiêu nghiệp vụ không cần tới. Tương tự, tài liệu lưu trực tiếp
// publicId (Cloudinary, cùng cơ chế đã dùng cho chat attachment) ngay trên block — không cần
// collection Document riêng.
const lessonVideoBlockSchema = new Schema(
  {
    platform: { type: String, enum: ["YOUTUBE", "VIMEO"], required: true },
    externalId: { type: String, required: true, trim: true }, // ID video trên platform, dùng để nhúng + gọi API lấy currentTime
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: "" },
    // Thời lượng thật (giây) — dùng làm mẫu số khi tính % đã xem (BR-1.4). [GT] nhập tay lúc
    // thêm video vì MVP không gọi oEmbed API để tự lấy.
    durationSeconds: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const lessonDocumentBlockSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    publicId: { type: String, required: true, trim: true }, // Cloudinary public_id
    fileType: { type: String, trim: true, default: "" }, // pdf/docx/pptx/xlsx/png/jpg
    bytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const lessonBlockSchema = new Schema(
  {
    type: { type: String, enum: ["VIDEO", "DOCUMENT", "PRACTICE_QUIZ"], required: true },
    order: { type: Number, required: true, default: 0 },
    // BR-1.1: giáo viên đánh dấu từng block bắt buộc/tùy chọn — quyết định "hoàn thành Lesson"
    // chỉ xét block bắt buộc (mục 1.5).
    isRequired: { type: Boolean, default: true },
    video: { type: lessonVideoBlockSchema, default: null }, // bắt buộc khi type=VIDEO
    document: { type: lessonDocumentBlockSchema, default: null }, // bắt buộc khi type=DOCUMENT
    quizId: { type: Schema.Types.ObjectId, ref: "PracticeQuiz", default: null }, // bắt buộc khi type=PRACTICE_QUIZ
  },
  { timestamps: true }
);

// BR-1.2: mỗi Lesson tối đa 1 block PRACTICE_QUIZ — kiểm tra ở tầng service (cần đếm trong
// mảng), không validate được thuần túy ở schema.

const lessonSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Bài giảng phải thuộc về một Chủ đề (Topic)"],
    },
    title: {
      type: String,
      required: [true, "Tiêu đề bài giảng là bắt buộc"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Nội dung lý thuyết dạng rich content (text/công thức/ảnh) — khái niệm CŨ, giữ nguyên,
    // không thuộc phạm vi "block" mới (lý thuyết không có trạng thái hoàn thành riêng).
    content: [contentBlockSchema],
    blocks: [lessonBlockSchema],
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bài giảng phải có người tạo"],
    },
  },
  { timestamps: true }
);

lessonSchema.index({ topicId: 1, order: 1 });
lessonSchema.index({ topicId: 1, status: 1 });
lessonSchema.index({ createdBy: 1 });

lessonSchema.plugin(softDeletePlugin);

export default model("Lesson", lessonSchema);
