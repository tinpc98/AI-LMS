import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");
  
  console.log("=== PHẦN A: KHẢO SÁT KIỂU DỮ LIỆU questionId ===");
  const exams = await Exam.find({});
  let legacyCount = 0;
  let snapshotStringCount = 0;
  let snapshotObjectIdCount = 0;
  let otherCount = 0;
  
  for (const exam of exams) {
    for (const q of (exam.questions || [])) {
      if (q.isSnapshot) {
        if (typeof q.questionId === "string") snapshotStringCount++;
        else if (q.questionId instanceof mongoose.Types.ObjectId) snapshotObjectIdCount++;
        else otherCount++;
      } else {
        if (q.questionId instanceof mongoose.Types.ObjectId) legacyCount++;
        else if (typeof q.questionId === "string") {
          if (mongoose.Types.ObjectId.isValid(q.questionId)) legacyCount++; // Often stored as string but meant as ObjectId
          else otherCount++;
        }
        else otherCount++;
      }
    }
  }
  
  console.log(`Legacy Question IDs (ObjectId/String): ${legacyCount}`);
  console.log(`Snapshot Question IDs (String/UUID): ${snapshotStringCount}`);
  console.log(`Snapshot Question IDs (ObjectId): ${snapshotObjectIdCount}`);
  console.log(`Other types: ${otherCount}`);
  console.log("---------------------------------------------------");

  console.log("=== PHẦN B: KHẢO SÁT 54 LƯỢT THI MỒ CÔI ===");
  const allAttempts = await ExamAttempt.find({}).populate("studentId", "name email fullName").lean();
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
