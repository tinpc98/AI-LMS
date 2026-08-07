import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");
  
  console.log("=== PHẦN B: KHẢO SÁT 54 LƯỢT THI MỒ CÔI ===");
  const allAttempts = await ExamAttempt.find({}).lean();
  let orphaned = [];
  
  for (const attempt of allAttempts) {
    // Kiem tra exam bị xoá mềm
    const exam = await Exam.findOne({ _id: attempt.examId }).lean();
    if (exam && exam.isDeleted) {
      orphaned.push(attempt);
    } else if (!exam) {
      // Hard deleted
      orphaned.push({ ...attempt, isHardDeleted: true });
    }
  }
  
  console.log(`Tổng số attempts mồ côi: ${orphaned.length}`);
  
  let withScore = 0;
  let nullScore = 0;
  for (const att of orphaned) {
    if (att.totalScore !== null && att.totalScore !== undefined) withScore++;
    else nullScore++;
  }
  console.log(`Mồ côi có điểm: ${withScore}, Không có điểm (null/undefined): ${nullScore}`);

  if (orphaned.length > 0) {
      console.log(`Sample orphan attempt:`, {
          _id: orphaned[0]._id,
          student: orphaned[0].studentId,
          score: orphaned[0].totalScore,
          status: orphaned[0].status
      });
  }

  mongoose.disconnect();
}

run();
