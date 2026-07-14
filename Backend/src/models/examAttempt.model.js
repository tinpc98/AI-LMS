import mongoose from "mongoose";

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

    // Trạng thái cực kỳ quan trọng để quản lý luồng thi
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "PARTIALLY_GRADED", "GRADED"],
      default: "IN_PROGRESS",
    },

    // Lưu đáp án học sinh đánh/viết
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selectedOption: { type: String }, // Dành cho trắc nghiệm
        essayText: { type: String }, // Dành cho tự luận
        pointsEarned: { type: Number, default: 0 }, // Điểm đạt được cho câu này
      },
    ],

    totalScore: { type: Number, default: 0 },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date }, // Chốt lại khi nộp bài hoặc hết giờ
    cheatCount: {
      type: Number,
      default: 0,
    },
    cheatLogs: [
      {
        cheatType: {
          type: String,
          // Giới hạn các loại lỗi để dễ làm Filter/Thống kê sau này
          enum: [
            "TAB_SWITCH",
            "FULLSCREEN_EXIT",
            "COPY_PASTE",
            "MULTIPLE_FACES",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("ExamAttempt", examAttemptSchema);
