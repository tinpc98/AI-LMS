// Đọc-only: kiểm tra dữ liệu thật trong MongoDB Atlas so với schema Mongoose hiện tại.
// KHÔNG có bất kỳ lệnh ghi nào (không update/insert/delete) — chỉ find() + validateSync().
// Chạy: node src/scripts/dbFieldAudit.js  (chỉ chạy trực tiếp, xem guard bên dưới)
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { pathToFileURL } from "node:url";

dotenv.config();

// Trình phân giải DNS mặc định của môi trường này không truy vấn được bản ghi SRV của
// Atlas (nslookup của hệ điều hành thì được) — trỏ sang DNS công khai để lấy đúng SRV.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import User from "../modules/auth/user.model.js";
import Course from "../modules/course/course.model.js";
import Subject from "../modules/subject/subject.model.js";
import Class from "../modules/class/class.model.js";
import ClassEnrollment from "../modules/classEnrollment/classEnrollment.model.js";
import ClassSession from "../modules/classSession/classSession.model.js";
import CommitmentEvent from "../modules/class/commitmentEvent.model.js";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import Topic from "../modules/topic/topic.model.js";
import Skill from "../modules/skill/skill.model.js";
import Lesson from "../modules/lesson/lesson.model.js";
import LessonProgress from "../modules/lesson/lessonProgress.model.js";
import PracticeQuiz from "../modules/lesson/practiceQuiz.model.js";
import PracticeQuizAttempt from "../modules/lesson/practiceQuizAttempt.model.js";
import Question from "../modules/question/question.model.js";
import Exam from "../modules/exam/exam.model.js";
import ExamSet from "../modules/exam-set/examSet.model.js";
import ExamSetShare from "../modules/exam-set/examSetShare.model.js";
import ExamAttempt from "../modules/exam-attempt/examAttempt.model.js";
import Assignment from "../modules/assignment/assignment.model.js";
import AssignmentAttempt from "../modules/assignment/assignmentAttempt.model.js";
import Attendance from "../modules/attendance/attendance.model.js";
import TeacherAttendance from "../modules/teacherAttendance/teacherAttendance.model.js";
import LearningActivity from "../modules/badge/learningActivity.model.js";
import StudentBadge from "../modules/badge/studentBadge.model.js";
import Grade from "../modules/grade/grade.model.js";
import Complaint from "../modules/complaint/complaint.model.js";
import Notification from "../modules/notification/notification.model.js";
import Folder from "../modules/folder/folder.model.js";
import Document from "../modules/document/document.model.js";
import Video from "../modules/video/video.model.js";
import Message from "../modules/chat/message.model.js";
import ChatReceipt from "../modules/chat/chatReceipt.model.js";
import CohortFeedback from "../modules/feedback/cohortFeedback.model.js";
import LearnerNeed from "../modules/learnerNeed/learnerNeed.model.js";
import Payment from "../modules/payment/payment.model.js";
import PaymentConfig from "../modules/payment/paymentConfig.model.js";
import Payroll from "../modules/payroll/payroll.model.js";
import PayrollConfig from "../modules/payroll/payrollConfig.model.js";
import PayrollPeriod from "../modules/payroll/payrollPeriod.model.js";
import AIRecommendation from "../modules/performance/aiRecommendation.model.js";
import PerformanceEvidence from "../modules/performance/performanceEvidence.model.js";
import StudentPerformance from "../modules/performance/studentPerformance.model.js";
import Weakness from "../modules/performance/weakness.model.js";
import AIConfig from "../modules/ai/models/aiConfig.model.js";
import AIUsage from "../modules/ai/models/aiUsage.model.js";
import AIDailyQuota from "../modules/ai/models/aiDailyQuota.model.js";
import AIChatSession from "../modules/ai/models/aiChatSession.model.js";
import AIChatMessage from "../modules/ai/models/aiChatMessage.model.js";
import AIGradingSuggestion from "../modules/ai/models/aiGradingSuggestion.model.js";
import AIKnowledgeSource from "../modules/ai/models/aiKnowledgeSource.model.js";
import AIKnowledgeChunk from "../modules/ai/models/aiKnowledgeChunk.model.js";
import AISummary from "../modules/ai/models/aiSummary.model.js";
import Announcement from "../modules/announcement/announcement.model.js";

const MODELS = [
  User,
  Course,
  Subject,
  Class,
  ClassEnrollment,
  ClassSession,
  CommitmentEvent,
  Enrollment,
  Topic,
  Skill,
  Lesson,
  LessonProgress,
  PracticeQuiz,
  PracticeQuizAttempt,
  Question,
  Exam,
  ExamSet,
  ExamSetShare,
  ExamAttempt,
  Assignment,
  AssignmentAttempt,
  Attendance,
  TeacherAttendance,
  LearningActivity,
  StudentBadge,
  Grade,
  Complaint,
  Notification,
  Folder,
  Document,
  Video,
  Message,
  ChatReceipt,
  CohortFeedback,
  LearnerNeed,
  Payment,
  PaymentConfig,
  Payroll,
  PayrollConfig,
  PayrollPeriod,
  AIRecommendation,
  PerformanceEvidence,
  StudentPerformance,
  Weakness,
  AIConfig,
  AIUsage,
  AIDailyQuota,
  AIChatSession,
  AIChatMessage,
  AIGradingSuggestion,
  AIKnowledgeSource,
  AIKnowledgeChunk,
  AISummary,
  Announcement,
];

const SAMPLE_LIMIT = 300;

async function auditModel(Model) {
  const name = Model.modelName;
  const total = await Model.countDocuments();
  if (total === 0) {
    return { name, total, sampled: 0, invalid: 0, errors: [] };
  }
  const docs = await Model.find().limit(SAMPLE_LIMIT);
  let invalid = 0;
  const errorSet = new Map();
  for (const doc of docs) {
    const err = doc.validateSync();
    if (err) {
      invalid++;
      for (const path of Object.keys(err.errors)) {
        const msg = err.errors[path].message;
        const key = `${path}: ${msg}`;
        errorSet.set(key, (errorSet.get(key) || 0) + 1);
      }
    }
  }
  return {
    name,
    total,
    sampled: docs.length,
    invalid,
    errors: [...errorSet.entries()].map(([k, count]) => `${k} (x${count})`),
  };
}

async function main() {
  console.log("Đang kết nối MongoDB (chỉ đọc, không ghi)...");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  console.log("Đã kết nối. Bắt đầu audit", MODELS.length, "model...\n");

  const results = [];
  for (const Model of MODELS) {
    try {
      results.push(await auditModel(Model));
    } catch (e) {
      results.push({
        name: Model.modelName,
        total: -1,
        sampled: 0,
        invalid: -1,
        errors: [String(e.message)],
      });
    }
  }

  console.log("=".repeat(80));
  console.log("BÁO CÁO SỐ LƯỢNG DOCUMENT (theo collection)");
  console.log("=".repeat(80));
  for (const r of results) {
    console.log(`${r.name.padEnd(24)} total=${r.total}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("BÁO CÁO LỖI VALIDATION (so với schema hiện tại)");
  console.log("=".repeat(80));
  const withErrors = results.filter((r) => r.errors.length > 0);
  if (withErrors.length === 0) {
    console.log("Không có model nào có lỗi validation trên mẫu đã kiểm tra.");
  } else {
    for (const r of withErrors) {
      console.log(`\n--- ${r.name} (sampled ${r.sampled}/${r.total}, invalid ${r.invalid}) ---`);
      for (const e of r.errors) console.log("  " + e);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

// Chỉ chạy khi được gọi trực tiếp (node dbFieldAudit.js), không chạy khi bị import.
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Audit thất bại:", e);
    process.exit(1);
  });
}
