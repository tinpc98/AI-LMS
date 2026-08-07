import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const countData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    const db = mongoose.connection.db;
    
    const examsCount = await db.collection("exams").countDocuments();
    const questionsCount = await db.collection("questions").countDocuments();
    const attemptsCount = await db.collection("examattempts").countDocuments();
    
    // lượt làm bài mồ côi (trỏ tới đề đã xóa)
    const activeExams = await db.collection("exams").distinct("_id", { isDeleted: false });
    const orphanAttempts = await db.collection("examattempts").countDocuments({ examId: { $nin: activeExams } });
    
    // câu hỏi thiếu đáp án đúng (từ Legacy questions)
    // multiple_choice, true_false, short_answer mà correctAnswer rỗng
    const invalidQuestions = await db.collection("questions").countDocuments({ 
        type: { $ne: "ESSAY" },
        $or: [
            { correctAnswer: { $exists: false } },
            { correctAnswer: null },
            { correctAnswer: "" }
        ]
    });
    
    // đề thi không có câu hỏi nào
    const emptyExams = await db.collection("exams").countDocuments({
        $or: [
            { questions: { $exists: false } },
            { questions: { $size: 0 } }
        ]
    });

    console.log(`- Đề thi: ${examsCount}`);
    console.log(`- Câu hỏi: ${questionsCount}`);
    console.log(`- Lượt làm bài: ${attemptsCount}`);
    console.log(`- Lượt làm bài mồ côi (trỏ tới đề đã xóa): ${orphanAttempts}`);
    console.log(`- Câu hỏi (legacy) thiếu đáp án đúng: ${invalidQuestions}`);
    console.log(`- Đề thi không có câu hỏi nào: ${emptyExams}`);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};

countData();
