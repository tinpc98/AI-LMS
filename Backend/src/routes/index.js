// File: src/routes/index.js
// NƠI DUY NHẤT khai báo sơ đồ mount API — gỡ khỏi main.js (Wave 2.4).
// Trước đây 24 router được mount rải rác giữa phần khởi tạo socket và phần error handler,
// khiến không nhìn được toàn cảnh URL của hệ thống ở một chỗ.
import express from "express";

// File này là COMPOSITION ROOT — nơi duy nhất được phép trỏ thẳng vào file router của
// module thay vì đi qua public API index.js.
//
// VÌ SAO phải như vậy: nếu index.js re-export cả router thì việc một module import
// module khác chỉ để lấy MODEL sẽ kéo theo luôn router -> controller của module đó.
// Điều này đã tạo ra vòng phụ thuộc thật ở Wave 3.2:
//   class/classProgress.repository -> #modules/lesson -> lesson.routes -> lesson.controller
//   -> #modules/class -> class.routes -> class.controller -> classProgress.service -> ...
// Toàn bộ 371 test vẫn pass với vòng này; chỉ rule no-circular (mức error) phát hiện.
//
// Vì thế: index.js của module chỉ export domain API (model, helper), còn việc lắp router
// do file này làm. Rule no-cross-module-internals có ngoại lệ riêng cho composition root.
import authRoutes from "#modules/auth/auth.routes.js";
import userRoutes from "#modules/auth/user.routes.js";
import classRoutes from "#modules/class/class.routes.js";
import lessonRoutes from "#modules/lesson/lesson.routes.js";
import assignmentRoutes from "#modules/assignment/assignment.routes.js";
import attendanceRoutes from "#modules/attendance/attendance.routes.js";
import gradeRoutes from "#modules/grade/grade.routes.js";
import examRoutes from "#modules/exam/exam.routes.js";
import examAttemptRoutes from "#modules/exam-attempt/examAttempt.routes.js";
import questionRoutes from "#modules/question/question.routes.js";
import announcementRoutes from "#modules/announcement/announcement.routes.js";
import courseRoutes from "#modules/course/course.routes.js";
import folderRoutes from "#modules/folder/folder.routes.js";
import notificationRoutes from "#modules/notification/notification.routes.js";
import liveRoutes from "#modules/live-session/live.routes.js";

import ExamSetRouter from "./examSet.routes.js";

import DashboardRouter from "./dashboard.routes.js";
import ReportRouter from "./report.routes.js";
import LearningRouter from "./learning.routes.js";
import AnalyticsRouter from "./analytics.routes.js";
import AISummaryRouter from "./aiSummary.routes.js";
import AIquestionRoutes from "./aiQuestion.routes.js";
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
router.use("/courses", courseRoutes);
router.use("/lessons", lessonRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/grades", gradeRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/folders", folderRoutes);

// ── Thống kê & báo cáo ───────────────────────────────────────────────────────
router.use("/dashboard", DashboardRouter);
router.use("/reports", ReportRouter);
router.use("/learning", LearningRouter);
router.use("/analytics", AnalyticsRouter);

// ── Thi trực tuyến & lớp học trực tuyến ─────────────────────────────────────
router.use("/questions", questionRoutes);
router.use("/exams", examRoutes);
router.use("/exam-attempts", examAttemptRoutes);
router.use("/exam-sets", ExamSetRouter);
router.use("/live", liveRoutes);

// ── AI ───────────────────────────────────────────────────────────────────────
router.use("/ai/lectures", AISummaryRouter);
router.use("/ai/lectures/:lessonId/question-sets", AIquestionRoutes);
router.use("/ai/exam-attempts", AIGradingRouter);
router.use("/ai/lessons", AIKnowledgeRouter);
router.use("/ai/chat", AIChatRouter);

export default router;
