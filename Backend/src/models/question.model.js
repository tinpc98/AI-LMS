import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["MCQ", "ESSAY"], // Trắc nghiệm (MCQ) hoặc Tự luận (ESSAY)
      required: true,
    },
    // Lưu ý: Chỉ bắt buộc có options và correctAnswer nếu là trắc nghiệm
    options: [
      {
        type: String,
      },
    ],
    correctAnswer: {
      type: String,
    },
    // Yêu cầu 2: Phân hóa độ khó
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    // Yêu cầu 3: ID người tạo (tạm thời để nullable/không bắt buộc)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    topic: {
      type: String,
      required: true,
      // Gợi ý dữ liệu thực tế: 'Unit 8: Ordering a meal in a restaurant'
    },
    tags: [
      {
        type: String,
        // Gợi ý: ['seafood', 'buffet_vocabulary', 'grammar']
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Question", questionSchema);
