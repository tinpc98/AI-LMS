import mongoose from "mongoose";
import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";
import examAttemptService from "../services/examAttempt.service.js";

const runTests = async () => {
  console.log("==========================================");
  console.log("🧪 BẮT ĐẦU UNIT TEST: EXAM ATTEMPT SNAPSHOT COMPATIBILITY");
  console.log("==========================================\n");

  let mockExamId = new mongoose.Types.ObjectId();
  let mockAttemptId = new mongoose.Types.ObjectId();
  let mockStudentId = new mongoose.Types.ObjectId();

  const mockSnapshotQuestionId = "q-uuid-snapshot-123";
  const mockLegacyQuestionId = new mongoose.Types.ObjectId();

  const mockExam = {
    _id: mockExamId,
    title: "Test Exam Snapshot",
    duration: 60,
    questions: [
      {
        questionId: mockSnapshotQuestionId,
        isSnapshot: true,
        points: 5,
        snapshotData: {
          type: "multiple_choice",
          content: "1 + 1 = ?",
          options: [{ text: "2" }, { text: "3" }],
          correctAnswer: "2"
        }
      },
      {
        questionId: mockLegacyQuestionId,
        isSnapshot: false,
        points: 5
      }
    ]
  };

  const mockAttempt = {
    _id: mockAttemptId,
    examId: mockExam, // populated
    studentId: mockStudentId,
    status: "IN_PROGRESS",
    startTime: new Date(),
    save: () => Promise.resolve(),
  };

  let passed = 0;
  let failed = 0;

  const assertEqual = (name, actual, expected) => {
    if (actual === expected) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Expected: ${expected}`);
      console.error(`   Actual: ${actual}`);
      failed++;
    }
  };

  // 1. Test gradeSubmission with mixed snapshot & legacy
  try {
    ExamAttempt.findById = () => ({
      populate: () => Promise.resolve(mockAttempt)
    });

    Question.find = () => ({
      lean: () => Promise.resolve([
        {
          _id: mockLegacyQuestionId,
          type: "multiple_choice",
          content: "2 + 2 = ?",
          options: [{ text: "4" }, { text: "5" }],
          correctAnswer: "4"
        }
      ])
    });

    const studentAnswers = [
      { questionId: mockSnapshotQuestionId, selectedOption: "2" },
      { questionId: mockLegacyQuestionId, selectedOption: "5" } // Sai
    ];

    await examAttemptService.gradeSubmission(mockAttemptId, studentAnswers);

    assertEqual("Test 1: gradeSubmission snapshot (Mixed IDs)", mockAttempt.totalScore, 5);
    assertEqual("Test 2: Status updated to GRADED", mockAttempt.status, "GRADED");
    assertEqual("Test 3: Answer array contains questionSource snapshot", mockAttempt.answers[0].questionSource, "snapshot");
    assertEqual("Test 4: Answer array contains questionSource legacy", mockAttempt.answers[1].questionSource, "legacy");

  } catch (error) {
    console.error("❌ FAIL: gradeSubmission threw error", error);
    failed++;
  }

  console.log("\n==========================================");
  console.log(`🎯 KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log("==========================================\n");

  if (failed > 0) process.exit(1);
  process.exit(0);
};

runTests();
