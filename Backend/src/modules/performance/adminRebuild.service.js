import mongoose from "mongoose";
import StudentPerformance from "./studentPerformance.model.js";
import Weakness from "./weakness.model.js";
import PerformanceEvidence from "./performanceEvidence.model.js";
import ExamAttempt from "../exam-attempt/examAttempt.model.js";
import AssignmentAttempt from "../assignment/assignmentAttempt.model.js";
import { processAttemptPerformanceService } from "./performance.service.js";

export const rebuildStudentPerformanceService = async (studentId) => {
  // 1. Clear existing performance data for student
  await StudentPerformance.deleteMany({ studentId });
  await Weakness.deleteMany({ studentId });
  await PerformanceEvidence.deleteMany({ studentId });

  // 2. Fetch all valid Submissions and ExamAttempts
  // According to rule: only SUBMITTED or GRADED
  const examAttempts = await ExamAttempt.find({
    studentId,
    status: { $in: ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"] }
  }).lean();

  const assignmentAttempts = await AssignmentAttempt.find({
    studentId,
    status: { $in: ["SUBMITTED", "GRADED"] }
  }).lean();

  // 3. Reprocess them in chronological order
  const allAttempts = [
    ...examAttempts.map(a => ({ ...a, sourceType: "EXAM", time: a.submittedAt || a.startedAt })),
    ...assignmentAttempts.map(a => ({ ...a, sourceType: "ASSIGNMENT", time: a.submittedAt || a.startedAt }))
  ].sort((a, b) => new Date(a.time) - new Date(b.time));

  for (const attempt of allAttempts) {
    await processAttemptPerformanceService(attempt, attempt.sourceType);
  }

  return {
    rebuiltExamAttempts: examAttempts.length,
    rebuiltAssignmentAttempts: assignmentAttempts.length,
  };
};
