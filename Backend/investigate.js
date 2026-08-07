import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import ExamSet from "./src/modules/exam-set/examSet.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import { Question } from "./src/modules/question/index.js";
import dotenv from "dotenv";

dotenv.config();

async function analyze() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");

  console.log("=== PHẦN A: BÁO CÁO CÂU HỎI UNKNOWN ===");
  
  // 1. Types in Legacy Question
  const legacyTypes = await Question.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);
  console.log("Legacy Question Types:");
  console.table(legacyTypes);

  // 2. Types in AI ExamSet
  const aiTypes = await ExamSet.aggregate([
    { $unwind: "$questions" },
    { $group: { _id: "$questions.type", count: { $sum: 1 } } }
  ]);
  console.log("AI ExamSet Question Types:");
  console.table(aiTypes);

  // Identify unsupported types
  // Supported in code: mcq, multiple_choice, single_choice, essay, free_text
  const unsupportedLegacy = legacyTypes.filter(t => !["MCQ", "ESSAY"].includes(t._id?.toUpperCase()));
  const unsupportedAI = aiTypes.filter(t => !["multiple_choice", "essay", "mcq", "single_choice", "free_text"].includes(t._id?.toLowerCase()));
  
  console.log("Unsupported Types found:", [...unsupportedLegacy.map(t => t._id), ...unsupportedAI.map(t => t._id)]);

  // 3. Exams containing these types
  // AI questions are embedded in Exam.questions where questionId is a string.
  // The actual question type is stored in the source ExamSet, BUT Exam Attempt resolves it dynamically.
  // Wait, `examQuestionResolver` gets the `type` directly from `Question` or `ExamSet.questions`.
  
  let affectedAttempts = [];
  
  if (unsupportedAI.length > 0) {
    const unsupportedTypeNames = unsupportedAI.map(t => t._id);
    
    // Find exam sets containing unsupported types
    const affectedExamSets = await ExamSet.find({ "questions.type": { $in: unsupportedTypeNames } });
    console.log(`Found ${affectedExamSets.length} ExamSets containing unsupported types.`);
    
    // Get all questionIds of these unsupported types
    let unsupportedQuestionIds = [];
    affectedExamSets.forEach(es => {
       es.questions.forEach(q => {
          if (unsupportedTypeNames.includes(q.type)) {
             unsupportedQuestionIds.push(q.questionId.toString());
          }
       });
    });
    
    // Find Exams using these questions
    // In Exam, `questions` array has `questionId` (string for AI).
    const affectedExams = await Exam.find({ "questions.questionId": { $in: unsupportedQuestionIds } });
    console.log(`Found ${affectedExams.length} Exams using these questions.`);
    
    // Find Attempts for these exams
    const attempts = await ExamAttempt.find({ 
      examId: { $in: affectedExams.map(e => e._id) },
      status: { $in: ["SUBMITTED", "GRADED"] }
    }).populate('studentId', 'name email');
    
    for (const attempt of attempts) {
       // Check if student actually answered an unsupported question
       const answeredUnsupported = attempt.answers?.some(a => unsupportedQuestionIds.includes(a.questionId?.toString()));
       if (answeredUnsupported) {
          affectedAttempts.push({
             attemptId: attempt._id,
             studentId: attempt.studentId?._id,
             studentName: attempt.studentId?.name,
             examId: attempt.examId,
             submittedAt: attempt.endTime || attempt.updatedAt,
             score: attempt.score
          });
       }
    }
  }

  console.log(`Found ${affectedAttempts.length} Attempts that answered UNKNOWN questions and might be graded 0.`);
  if (affectedAttempts.length > 0) {
     console.table(affectedAttempts.slice(0, 10)); // show up to 10
  }


  console.log("\n=== PHẦN B: BÁO CÁO UNIQUE INDEX EXAM ATTEMPT ===");
  
  const duplicateAttempts = await ExamAttempt.aggregate([
    { 
      $group: { 
        _id: { examId: "$examId", studentId: "$studentId" }, 
        count: { $sum: 1 },
        attempts: { $push: { id: "$_id", status: "$status", score: "$score", isDeleted: "$isDeleted", createdAt: "$createdAt" } }
      } 
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`Found ${duplicateAttempts.length} duplicated (examId, studentId) pairs.`);
  if (duplicateAttempts.length > 0) {
      // Just print the first 5 to see
      duplicateAttempts.slice(0, 5).forEach((dup, i) => {
         console.log(`Duplicate Pair ${i+1}: examId=${dup._id.examId}, studentId=${dup._id.studentId}`);
         console.table(dup.attempts);
      });
  }

  process.exit(0);
}

analyze().catch(console.error);
