// File: src/routes/index.js
// NƠI DUY NHẤT khai báo sơ đồ mount API — gỡ khỏi main.js (Wave 2.4).
// Trước đây 24 router được mount rải rác giữa phần khởi tạo socket và phần error handler,
// khiến không nhìn được toàn cảnh URL của hệ thống ở một chỗ.
import express from "express";

// Module đã migrate sang src/modules/ được import qua PUBLIC API (index.js), không thọc
// vào file nội bộ. Các router còn lại vẫn nằm ở src/routes/ cho tới lượt migrate của chúng.
import { authRoutes, userRoutes } from "#modules/auth";
import { classRoutes } from "#modules/class";

import LessonRouter from "./lesson.routes.js";
import AssignmentRouter from "./assignment.routes.js";
import QuestionRouter from "./question.routes.js";
import ExamRouter from "./exam.routes.js";
import ExamAttemptRouter from "./examAttempt.routes.js";
import ExamSetRouter from "./examSet.routes.js";
import LiveRouter from "./live.routes.js";
import AttendanceRouter from "./attendance.routes.js";
import GradeRouter from "./grade.routes.js";
import AnnouncementRouter from "./announcement.routes.js";
import CourseRouter from "./course.routes.js";
import DashboardRouter from "./dashboard.routes.js";
import ReportRouter from "./report.routes.js";
import NotificationRouter from "./notification.routes.js";
import LearningRouter from "./learning.routes.js";
import AnalyticsRouter from "./analytics.routes.js";
import FolderRouter from "./folder.routes.js";
import AISummaryRouter from "./aiSummary.routes.js";
import AIQuestionRouter from "./aiQuestion.routes.js";
import AIGradingRouter from "./aiGrading.routes.js";
import AIKnowledgeRouter from "./aiKnowledge.routes.js";
import AIChatRouter from "./aiChat.routes.js";

const router = express.Router();

// ── Người dùng & xác thực ────────────────────────────────────────────────────
// /auth  = đăng nhập + hồ sơ của chính mình (login, me)
// /users = quản trị người dùng, toàn bộ yêu cầu quyền Admin
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// ── Lớp học & nội dung giảng dạy ────────────────────────────────────────────
router.use("/classes", classRoutes);
router.use("/courses", CourseRouter);
router.use("/lessons", LessonRouter);
router.use("/assignments", AssignmentRouter);
router.use("/attendances", AttendanceRouter);
router.use("/grades", GradeRouter);
router.use("/announcements", AnnouncementRouter);
router.use("/notifications", NotificationRouter);
router.use("/folders", FolderRouter);

// ── Thống kê & báo cáo ───────────────────────────────────────────────────────
router.use("/dashboard", DashboardRouter);
router.use("/reports", ReportRouter);
router.use("/learning", LearningRouter);
router.use("/analytics", AnalyticsRouter);

// ── Thi trực tuyến & lớp học trực tuyến ─────────────────────────────────────
router.use("/questions", QuestionRouter);
router.use("/exams", ExamRouter);
router.use("/exam-attempts", ExamAttemptRouter);
router.use("/exam-sets", ExamSetRouter);
router.use("/live", LiveRouter);

// ── AI ───────────────────────────────────────────────────────────────────────
router.use("/ai/lectures", AISummaryRouter);
router.use("/ai/lectures/:lessonId/question-sets", AIQuestionRouter);
router.use("/ai/exam-attempts", AIGradingRouter);
router.use("/ai/lessons", AIKnowledgeRouter);
router.use("/ai/chat", AIChatRouter);

export default router;
