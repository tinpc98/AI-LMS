import mongoose, { Schema } from "mongoose";

// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 5) — LearningActivity giờ kiêm luôn vai trò "sổ cái XP":
// mỗi document là 1 LẦN được cộng XP, không phải 1 lượt thao tác. Trước đây model này tồn tại
// nhưng KHÔNG NƠI NÀO ghi vào nó (xác nhận qua grep toàn bộ backend) — activityXP trong
// learningRanking.service.js đếm số document rỗng luôn ra 0. Giờ mới có writer thật.
//
// Nguyên tắc chống gian lận rẻ nhất và quan trọng nhất (theo đặc tả): mỗi sự kiện được cộng XP
// ĐÚNG MỘT LẦN cho mỗi đối tượng — thực thi bằng unique index {studentId, sourceRef}, KHÔNG
// phải bằng kiểm tra "đã có chưa" trước khi ghi (điều kiện đua giữa 2 request đồng thời).
// `sourceRef` là chuỗi định danh duy nhất cho sự kiện, ví dụ "lesson:<lessonId>",
// "quiz-pass:<blockId>", "attendance:<attendanceId>".
const learningActivitySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    activityType: {
      type: String,
      enum: [
        "Daily Login",
        "Lesson Completed",
        "Practice Quiz Passed",
        "Assignment Submitted",
        "Exam Finished",
        "Attendance Present",
        "QA Post Pinned",
        "Learning Streak",
        "Course Completed",
      ],
      required: true,
    },
    // Khoá chống cộng trùng — DUY NHẤT theo học sinh (xem index bên dưới).
    sourceRef: {
      type: String,
      required: true,
      trim: true,
    },
    // Số XP thực tế được cộng ở lần này — có thể THẤP HƠN mức danh nghĩa của activityType nếu
    // đã chạm trần XP/ngày (xem xp.js#DAILY_XP_CAP); vẫn ghi document (kể cả xpAwarded=0) để
    // giữ tác dụng chống-cộng-trùng của sourceRef cho các lần gọi lại/retry.
    xpAwarded: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

learningActivitySchema.index({ studentId: 1, sourceRef: 1 }, { unique: true });
learningActivitySchema.index({ studentId: 1, classId: 1, createdAt: -1 });
learningActivitySchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model("LearningActivity", learningActivitySchema);
