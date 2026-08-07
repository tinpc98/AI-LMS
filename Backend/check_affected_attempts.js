import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");
  
  const allAttempts = await ExamAttempt.find({}).populate("examId");
  console.log(`Total attempts in DB: ${allAttempts.length}`);
  
  const affectedAttempts = allAttempts.filter(a => {
    return ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"].includes(a.status) &&
           a.totalScore === 0 &&
           a.examId && a.examId.isAIGenerated;
  });

  let count = 0;
  for (const attempt of affectedAttempts) {
    count++;
    console.log(`Student ID: ${attempt.studentId}`);
    console.log(`Exam: ${attempt.examId.title}`);
    console.log(`Submitted At: ${attempt.updatedAt}`);
    console.log(`Has Answers Data: ${attempt.answers.length > 0}`);
    if (attempt.answers.length > 0) {
      console.log(`Answer sample: ${JSON.stringify(attempt.answers[0])}`);
    }
    console.log("-------------------");
  }
  console.log(`Total affected: ${count}`);
  
  mongoose.disconnect();
}

run();
