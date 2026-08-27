import mongoose, { Schema, model } from "mongoose";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1.5): trước đây "tiến độ" chỉ là 1 boolean tự khai báo
// (`completed`) — học sinh gọi API là đánh dấu xong, không xem video/tài liệu/quiz gì cũng
// được. Giờ theo dõi TỪNG BLOCK (VIDEO/DOCUMENT/PRACTICE_QUIZ) riêng, và `completed` toàn bài
// chỉ true khi mọi block BẮT BUỘC đã hoàn thành thật (mục 1.5).
//
// GIỮ NGUYÊN 2 field top-level `progress`/`completed` — classProgress.repository.js và
// badge/learningRanking.service.js đã đọc trực tiếp 2 field này để tính tiến độ lớp/XP, không
// đổi tên/ý nghĩa để không phá 2 nơi tiêu thụ thật đó; chỉ đổi CÁCH tính ra chúng (từ block
// thật thay vì tự khai báo).
const blockProgressSchema = new Schema(
  {
    blockId: { type: Schema.Types.ObjectId, required: true }, // khớp Lesson.blocks[]._id
    type: { type: String, enum: ["VIDEO", "DOCUMENT", "PRACTICE_QUIZ"], required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    // VIDEO — BR-1.4: % xem tính theo UNION các đoạn đã xem (giây), không phải vị trí con trỏ,
    // để tua nhanh tới cuối không được tính là đã xem.
    watchedRanges: {
      type: [
        {
          start: { type: Number, required: true },
          end: { type: Number, required: true },
          _id: false,
        },
      ],
      default: [],
    },
    watchedSeconds: { type: Number, default: 0 }, // cache = union(watchedRanges), cập nhật mỗi lần ghi
    // DOCUMENT — mở và ở lại đủ lâu (mục 1.5: ≥30 giây).
    firstOpenedAt: { type: Date, default: null },
    totalOpenSeconds: { type: Number, default: 0 },
    // PRACTICE_QUIZ — BR-1.6: điểm ghi nhận là lần cao nhất.
    bestScorePercent: { type: Number, default: null },
  },
  { _id: false }
);

const lessonProgressSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    blocks: { type: [blockProgressSchema], default: [] },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    // 0-100, % số block BẮT BUỘC đã hoàn thành — thay cho field tự khai báo cũ.
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export default model("LessonProgress", lessonProgressSchema);
