import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import dotenv from "dotenv";

dotenv.config();

async function cleanupDuplicates() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");

  const duplicateAttempts = await ExamAttempt.aggregate([
    { 
      $group: { 
        _id: { examId: "$examId", studentId: "$studentId" }, 
        count: { $sum: 1 },
        attempts: { $push: { id: "$_id", status: "$status", score: "$score", isDeleted: "$isDeleted", createdAt: "$createdAt", totalScore: "$totalScore" } }
      } 
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  let totalDeleted = 0;

  for (const dup of duplicateAttempts) {
      // Find the one to keep.
      // Priority: GRADED > PARTIALLY_GRADED > SUBMITTED > IN_PROGRESS
      // Tie breaker: highest totalScore
      // Tie breaker 2: latest createdAt
      
      const statusWeight = {
          "GRADED": 4,
          "PARTIALLY_GRADED": 3,
          "SUBMITTED": 2,
          "IN_PROGRESS": 1
      };
      
      const sorted = dup.attempts.sort((a, b) => {
          const weightA = statusWeight[a.status] || 0;
          const weightB = statusWeight[b.status] || 0;
          if (weightA !== weightB) return weightB - weightA;
          
          const scoreA = a.totalScore || 0;
          const scoreB = b.totalScore || 0;
          if (scoreA !== scoreB) return scoreB - scoreA;
          
          return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      const keepId = sorted[0].id;
      const deleteIds = sorted.slice(1).map(a => a.id);
      
      const res = await ExamAttempt.updateMany(
          { _id: { $in: deleteIds } },
          { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      
      totalDeleted += res.modifiedCount;
      console.log(`Pair examId=${dup._id.examId}, studentId=${dup._id.studentId}: kept ${keepId}, soft-deleted ${deleteIds.length} attempts`);
  }

  console.log(`Cleanup complete. Total soft-deleted: ${totalDeleted}`);
  process.exit(0);
}

cleanupDuplicates().catch(console.error);
