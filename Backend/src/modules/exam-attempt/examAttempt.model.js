import mongoose from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "PARTIALLY_GRADED", "GRADED"],
      default: "IN_PROGRESS",
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.Mixed, // Hỗ trợ ObjectId (Legacy) hoặc String/UUID (Snapshot)
          required: true,
        },
        questionSource: {
          type: String,
          enum: ["legacy", "snapshot"],
          default: "legacy",
        },
        selectedOption: { type: String },
        essayText: { type: String },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    totalScore: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    cheatCount: {
      type: Number,
      default: 0,
    },
    cheatLogs: [
      {
        cheatType: {
          type: String,
          enum: ["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_PASTE", "MULTIPLE_FACES"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cheatWarnings: {
      type: Number,
      default: 0,
    },

    // ── Ghi nhận nộp muộn (Wave 7+) ──────────────────────────────────────────
    //
    // Trước đây bài nộp quá hạn được chấp nhận ÂM THẦM: gradeSubmission kẹp lại endTime cho
    // gọn rồi chấm bình thường, không để lại dấu vết. Giáo viên không có cách nào biết một
    // học sinh đã làm quá giờ.
    //
    // Hai trường này KHÔNG chặn bài nộp — chúng chỉ ghi lại sự việc. Có từ chối bài muộn hay
    // không là quyết định về chính sách thi cử, và giờ đây người có thẩm quyền đã có dữ kiện
    // để quyết, thay vì phải tin rằng chuyện đó không xảy ra.
    isLate: {
      type: Boolean,
      default: false,
    },
    /** Số giây vượt quá hạn, ĐÃ trừ ân hạn 2 phút cho độ trễ mạng. */
    lateBySeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

examAttemptSchema.plugin(softDeletePlugin);

export default mongoose.model("ExamAttempt", examAttemptSchema);
